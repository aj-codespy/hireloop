"""Scheduled export service for HireLoop V1."""

from __future__ import annotations

import asyncio
import csv
import io
import json
import logging
import os
import tempfile
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

import httpx

from config import supabase_enabled
from interview.supabase_store import get_store

logger = logging.getLogger(__name__)


class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    PARQUET = "parquet"


class ExportDestinationType(str, Enum):
    S3 = "s3"
    SFTP = "sftp"
    EMAIL = "email"
    GOOGLE_SHEETS = "google_sheets"


class ExportStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExportType(str, Enum):
    APPLICATIONS = "applications"
    CANDIDATES = "candidates"
    SCORES = "scores"
    PIPELINE = "pipeline"
    COMPLIANCE = "compliance"
    CUSTOM = "custom"


@dataclass
class ExportConfig:
    id: str
    org_id: str
    name: str
    type: ExportType
    schedule: dict  # {frequency, timezone, hour, day_of_week, day_of_month}
    format: ExportFormat
    destination: dict  # {type, bucket, prefix, credentials_ref, etc.}
    filters: Optional[dict] = None
    field_mapping: Optional[dict] = None
    include_headers: bool = True
    compression: Optional[str] = None  # gzip, zip
    encryption: Optional[str] = None  # pgp
    active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_run_at: Optional[datetime] = None
    last_status: Optional[str] = None


@dataclass
class ExportJob:
    id: str
    config_id: str
    org_id: str
    status: ExportStatus = ExportStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    rows_exported: int = 0
    file_path: Optional[str] = None
    file_size: int = 0
    error: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================
# Formatters
# ============================================================

# Try to import optional formatters
try:
    import pyarrow as pa
    import pyarrow.parquet as pq
    PARQUET_AVAILABLE = True
except ImportError:
    PARQUET_AVAILABLE = False
    pa = None
    pq = None


class BaseFormatter(ABC):
    """Base class for export formatters."""

    @abstractmethod
    def format(self, data: list[dict], field_mapping: Optional[dict] = None) -> bytes:
        """Format data and return bytes."""
        pass

    def apply_field_mapping(self, row: dict, field_mapping: Optional[dict]) -> dict:
        if not field_mapping:
            return row
        return {field_mapping.get(k, k): v for k, v in row.items()}


class CSVFormatter(BaseFormatter):
    """CSV formatter with optional compression."""

    def __init__(self, include_headers: bool = True, delimiter: str = ","):
        self.include_headers = include_headers
        self.delimiter = delimiter

    def format(self, data: list[dict], field_mapping: Optional[dict] = None) -> bytes:
        if not data:
            return b""

        # Apply field mapping
        mapped_data = [self.apply_field_mapping(row, field_mapping) for row in data]

        # Get all unique keys for headers
        all_keys = set()
        for row in mapped_data:
            all_keys.update(row.keys())
        headers = sorted(all_keys)

        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=headers,
            delimiter=self.delimiter,
            quoting=csv.QUOTE_MINIMAL,
            extrasaction="ignore",
        )

        if self.include_headers:
            writer.writeheader()

        for row in mapped_data:
            writer.writerow({k: self._serialize_value(v) for k, v in row.items()})

        return output.getvalue().encode("utf-8")

    def _serialize_value(self, value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, (dict, list)):
            return json.dumps(value, separators=(",", ":"))
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)


class JSONFormatter(BaseFormatter):
    """JSON/JSONL formatter."""

    def __init__(self, lines: bool = True):
        self.lines = lines  # JSONL if True, pretty JSON array if False

    def format(self, data: list[dict], field_mapping: Optional[dict] = None) -> bytes:
        if not data:
            return b"[]"

        mapped_data = [self.apply_field_mapping(row, field_mapping) for row in data]

        if self.lines:
            # JSONL - one JSON object per line
            lines = [json.dumps(self._serialize_row(row), separators=(",", ":")) for row in data]
            return "\n".join(lines).encode("utf-8")
        else:
            # Pretty JSON array
            return json.dumps(
                [self._serialize_row(row) for row in data],
                indent=2,
                default=str,
            ).encode("utf-8")

    def _serialize_row(self, row: dict) -> dict:
        result = {}
        for k, v in row.items():
            if isinstance(v, datetime):
                result[k] = v.isoformat()
            elif v is None:
                result[k] = None
            else:
                result[k] = v
        return result


class ParquetFormatter(BaseFormatter):
    """Parquet formatter (requires pyarrow)."""

    def format(self, data: list[dict], field_mapping: Optional[dict] = None) -> bytes:
        try:
            import pyarrow as pa
            import pyarrow.parquet as pq
        except ImportError:
            raise RuntimeError("pyarrow required for Parquet format. Install with: pip install pyarrow")

        if not data:
            # Create empty table with schema
            table = pa.table({})
        else:
            mapped_data = [self.apply_field_mapping(row, field_mapping) for row in data]
            table = pa.Table.from_pylist(mapped_data)

        buf = io.BytesIO()
        pq.write_table(table, buf)
        return buf.getvalue()


# ============================================================
# Destinations
# ============================================================

class BaseDestination(ABC):
    """Base class for export destinations."""

    @abstractmethod
    async def upload(self, data: bytes, path: str, config: dict) -> str:
        """Upload data and return the final path/URL."""
        pass


class S3Destination(BaseDestination):
    """AWS S3 destination."""

    async def upload(self, data: bytes, path: str, config: dict) -> str:
        try:
            import boto3
            from botocore.exceptions import ClientError
        except ImportError:
            raise RuntimeError("boto3 required for S3 destination. Install with: pip install boto3")

        bucket = config.get("bucket")
        region = config.get("region", "us-east-1")
        prefix = config.get("prefix", "")

        if not bucket:
            raise ValueError("S3 destination requires 'bucket' in config")

        # Build full path
        full_path = f"{prefix}/{path}" if prefix else path

        # Credentials
        access_key = config.get("access_key")
        secret_key = config.get("secret_key")
        session_token = config.get("session_token")

        session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=session_token,
            region_name=region,
        )

        s3 = session.client("s3")

        try:
            # Multipart upload for large files
            if len(data) > 100 * 1024 * 1024:  # 100MB
                await self._multipart_upload(s3, bucket, full_path, data)
            else:
                s3.put_object(
                    Bucket=bucket,
                    Key=full_path,
                    Body=data,
                    ServerSideEncryption="AES256",
                )

            return f"s3://{bucket}/{full_path}"
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise RuntimeError(f"S3 upload failed: {e}")

    async def _multipart_upload(self, s3, bucket: str, key: str, data: bytes):
        """Upload large files using multipart upload."""
        # Create multipart upload
        response = s3.create_multipart_upload(Bucket=bucket, Key=key)
        upload_id = response["UploadId"]

        parts = []
        chunk_size = 50 * 1024 * 1024  # 50MB chunks

        try:
            for i in range(0, len(data), chunk_size):
                chunk = data[i:i + chunk_size]
                part_num = i // chunk_size + 1

                response = s3.upload_part(
                    Bucket=bucket,
                    Key=key,
                    PartNumber=part_num,
                    UploadId=upload_id,
                    Body=chunk,
                )
                parts.append({"ETag": response["ETag"], "PartNumber": part_num})

            # Complete multipart upload
            s3.complete_multipart_upload(
                Bucket=bucket,
                Key=key,
                UploadId=upload_id,
                MultipartUpload={"Parts": parts},
            )
        except Exception:
            s3.abort_multipart_upload(Bucket=bucket, Key=key, UploadId=upload_id)
            raise


class SFTPDestination(BaseDestination):
    """SFTP destination."""

    async def upload(self, data: bytes, path: str, config: dict) -> str:
        try:
            import asyncssh
        except ImportError:
            raise RuntimeError("asyncssh required for SFTP destination. Install with: pip install asyncssh")

        host = config.get("host")
        username = config.get("username")
        password = config.get("password")
        private_key = config.get("private_key")
        port = config.get("port", 22)
        remote_path = config.get("path", "")

        if not host or not username:
            raise ValueError("SFTP destination requires 'host' and 'username'")

        full_path = f"{remote_path}/{path}" if remote_path else path

        async with asyncssh.connect(
            host,
            port=port,
            username=username,
            password=password,
            client_keys=[private_key] if private_key else None,
        ) as conn:
            async with conn.start_sftp_client() as sftp:
                # Ensure remote directory exists
                await self._ensure_dir(sftp, os.path.dirname(full_path))
                await sftp.write(full_path, data)

        return f"sftp://{host}{full_path}"

    async def _ensure_dir(self, sftp, path: str):
        """Create remote directory if it doesn't exist."""
        if not path:
            return
        try:
            await sftp.stat(path)
        except FileNotFoundError:
            await self._ensure_dir(sftp, os.path.dirname(path))
            await sftp.mkdir(path)


class EmailDestination(BaseDestination):
    """Email destination (sends export as attachment)."""

    async def upload(self, data: bytes, path: str, config: dict) -> str:
        try:
            import aiosmtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.application import MIMEApplication
            from email.mime.text import MIMEText
        except ImportError:
            raise RuntimeError("aiosmtplib required for email destination. Install with: pip install aiosmtplib")

        smtp_host = config.get("smtp_host")
        smtp_port = config.get("smtp_port", 587)
        smtp_user = config.get("smtp_user")
        smtp_password = config.get("smtp_password")
        from_email = config.get("from_email")
        to_emails = config.get("to_emails", [])
        subject = config.get("subject", "HireLoop Export")
        body = config.get("body", "Please find the attached export.")

        if not all([smtp_host, smtp_user, smtp_password, from_email, to_emails]):
            raise ValueError("Email destination requires smtp_host, smtp_user, smtp_password, from_email, to_emails")

        msg = MIMEMultipart()
        msg["From"] = from_email
        msg["To"] = ", ".join(to_emails)
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Attach export file
        attachment = MIMEApplication(data, Name=os.path.basename(path))
        attachment["Content-Disposition"] = f'attachment; filename="{os.path.basename(path)}"'
        msg.attach(attachment)

        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True,
        )

        return f"email:{','.join(to_emails)}"


class GoogleSheetsDestination(BaseDestination):
    """Google Sheets destination."""

    async def upload(self, data: bytes, path: str, config: dict) -> str:
        try:
            import gspread
            from google.oauth2.service_account import Credentials
        except ImportError:
            raise RuntimeError("gspread required for Google Sheets destination. Install with: pip install gspread google-auth")

        credentials_path = config.get("credentials_path")
        spreadsheet_id = config.get("spreadsheet_id")
        sheet_name = config.get("sheet_name", "Export")
        clear_first = config.get("clear_first", True)

        if not credentials_path or not spreadsheet_id:
            raise ValueError("Google Sheets destination requires 'credentials_path' and 'spreadsheet_id'")

        # Read CSV data
        df_data = data.decode("utf-8")
        rows = list(csv.reader(io.StringIO(df_data)))

        # Authenticate
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ]
        credentials = Credentials.from_service_account_file(credentials_path, scopes=scopes)
        gc = gspread.authorize(credentials)

        # Open spreadsheet
        sh = gc.open_by_key(spreadsheet_id)

        # Get or create worksheet
        try:
            worksheet = sh.worksheet(sheet_name)
        except gspread.WorksheetNotFound:
            worksheet = sh.add_worksheet(title=sheet_name, rows=1000, cols=50)

        if clear_first:
            worksheet.clear()

        # Write data
        worksheet.update("A1", rows)

        return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit#gid={worksheet.id}"


# ============================================================
# Export Runner
# ============================================================

class ExportRunner:
    """Runs export jobs."""

    def __init__(self):
        pass

    async def run_export(self, config: ExportConfig) -> ExportJob:
        """Run a single export job."""
        job = ExportJob(
            id=str(uuid4()),
            config_id=config.id,
            org_id=config.org_id,
            status=ExportStatus.RUNNING,
            started_at=datetime.now(timezone.utc),
        )

        try:
            # Fetch data based on export type
            data = await self._fetch_data(config)

            if not data:
                logger.warning(f"Export {config.id}: No data to export")
                return ExportJob(
                    id=str(uuid4()),
                    config_id=config.id,
                    org_id=config.org_id,
                    status=ExportStatus.COMPLETED,
                    started_at=datetime.now(timezone.utc),
                    completed_at=datetime.now(timezone.utc),
                    rows_exported=0,
                )

            # Format data
            formatter_cls = FORMATTERS.get(config.format)
            if not formatter_cls:
                raise ValueError(f"Unsupported format: {config.format}")

            formatter = formatter_cls()
            formatted_data = formatter.format(data, config.field_mapping)

            # Apply compression if needed
            final_data = formatted_data
            final_path = f"{config.id}/{datetime.now(timezone.utc).strftime('%Y/%m/%d')}/{config.name}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.{config.format.value}"

            if config.compression == "gzip":
                import gzip
                final_data = gzip.compress(formatted_data)
                final_path += ".gz"
            elif config.compression == "zip":
                import zipfile
                buf = io.BytesIO()
                with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                    zf.writestr(f"export.{config.format.value}", formatted_data)
                final_data = buf.getvalue()
                final_path += ".zip"

            # Upload to destination
            destination_cls = DESTINATIONS.get(config.destination.get("type"))
            if not destination_cls:
                raise ValueError(f"Unsupported destination type: {config.destination.get('type')}")

            destination = destination_cls()
            destination_path = await destination_cls().upload(formatted_data, final_path, config.destination)

            return ExportJob(
                id=str(uuid4()),
                config_id=config.id,
                org_id=config.org_id,
                status=ExportStatus.COMPLETED,
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
                rows_exported=len(data),
                file_path=destination_path,
                file_size=len(final_data),
            )

        except Exception as e:
            logger.error(f"Export {config.id} failed: {e}", exc_info=True)
            return ExportJob(
                id=str(uuid4()),
                config_id=config.id,
                org_id=config.org_id,
                status=ExportStatus.FAILED,
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
                error=str(e),
            )

    async def _fetch_data(self, config: ExportConfig) -> list[dict]:
        """Fetch data based on export type."""
        store = get_store()
        if not store:
            raise RuntimeError("Database not configured")

        filters = config.filters or {}
        org_id = config.org_id

        if config.type == ExportType.APPLICATIONS:
            return await self._fetch_applications(store, org_id, config.filters)
        elif config.type == ExportType.CANDIDATES:
            return await self._fetch_candidates(store, org_id, config.filters)
        elif config.type == ExportType.SCORES:
            return await self._fetch_scores(store, org_id, config.filters)
        elif config.type == ExportType.PIPELINE:
            return await self._fetch_pipeline(store, org_id, config.filters)
        elif config.type == ExportType.COMPLIANCE:
            return await self._fetch_compliance(store, org_id, config.filters)
        else:
            raise ValueError(f"Unsupported export type: {config.type}")

    async def _fetch_applications(self, store: Any, org_id: str, filters: dict) -> list[dict]:
        params = {
            "org_id": f"eq.{org_id}",
            "select": "id,candidate_id,job_role_id,form_response,status,interview_token,token_expires_at,current_stage_id,created_at",
        }

        if filters.get("status"):
            params["status"] = f"eq.{filters['status']}"
        if filters.get("job_id"):
            params["job_role_id"] = f"eq.{filters['job_id']}"
        if filters.get("date_from"):
            params["created_at"] = f"gte.{filters['date_from']}"
        if filters.get("date_to"):
            params["created_at"] = f"lte.{filters['date_to']}"

        return await store._request("GET", "applications", params=params)

    async def _fetch_candidates(self, store: Any, org_id: str, filters: dict) -> list[dict]:
        params = {
            "org_id": f"eq.{org_id}",
            "select": "id,name,email,phone,resume_url,source,created_at",
        }
        return await store._request("GET", "candidates", params=params)

    async def _fetch_scores(self, store: Any, org_id: str, filters: dict) -> list[dict]:
        # Join applications -> interview_sessions -> scores
        params = {
            "org_id": f"eq.{org_id}",
            "select": "id,application_id,question_scores,overall_score,status,ended_at,created_at",
        }
        return await store._request("GET", "interview_sessions", params=params)

    async def _fetch_pipeline(self, store: Any, org_id: str, filters: dict) -> list[dict]:
        params = {
            "org_id": f"eq.{org_id}",
            "select": "id,name,stage_type,order_index,config,created_at",
        }
        return await store._request("GET", "pipeline_stages", params=params)

    async def _fetch_compliance(self, store: Any, org_id: str, filters: dict) -> list[dict]:
        params = {
            "org_id": f"eq.{org_id}",
            "select": "id,actor_id,entity_type,entity_id,action,metadata,created_at",
        }
        return await store._request("GET", "activity_log", params=params)


# ============================================================
# Scheduler
# ============================================================

class ExportScheduler:
    """Schedules and runs exports based on their configuration."""

    def __init__(self, runner: ExportRunner):
        self.runner = runner
        self._running = False

    async def start(self):
        """Start the scheduler loop."""
        self._running = True
        while self._running:
            await self._check_and_run()
            await asyncio.sleep(60)  # Check every minute

    def stop(self):
        self._running = False

    async def _check_and_run(self):
        store = get_store()
        if not store:
            return

        # Get active export configs due to run
        now = datetime.now(timezone.utc)
        configs = await store._request(
            "GET",
            "export_jobs",
            params={
                "active": "eq.true",
                "or": f"(schedule->>frequency.eq.daily,schedule->>frequency.eq.hourly,schedule->>frequency.eq.weekly,schedule->>frequency.eq.monthly)",
            },
        )

        for config_data in configs or []:
            config = ExportConfig(**config_data)
            if self._should_run(config, now):
                logger.info(f"Running scheduled export: {config.name}")
                job = await self.runner.run_export(config)
                # Store job result
                await self._store_job_result(job)

    def _should_run(self, config: ExportConfig, now: datetime) -> bool:
        """Check if export should run now based on schedule."""
        schedule = config.schedule
        freq = schedule.get("frequency")
        tz = schedule.get("timezone", "UTC")
        hour = schedule.get("hour", 0)
        minute = schedule.get("minute", 0)

        # Convert now to schedule timezone
        # For simplicity, using UTC - implement proper tz conversion in production

        if freq == "hourly":
            return now.minute == minute
        elif freq == "daily":
            return now.hour == hour and now.minute == minute
        elif freq == "weekly":
            day_of_week = schedule.get("day_of_week", 0)  # 0=Monday
            return now.weekday() == day_of_week and now.hour == hour and now.minute == minute
        elif freq == "monthly":
            day_of_month = schedule.get("day_of_month", 1)
            return now.day == day_of_month and now.hour == hour and now.minute == minute

        return False

    async def _store_job_result(self, job: ExportJob):
        store = get_store()
        if not store:
            return

        await store._request(
            "POST",
            "export_job_runs",
            json={
                "id": job.id,
                "config_id": job.config_id,
                "org_id": job.org_id,
                "status": job.status.value,
                "started_at": job.started_at.isoformat() if job.started_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "rows_exported": job.rows_exported,
                "file_path": job.file_path,
                "file_size": job.file_size,
                "error": job.error,
                "created_at": job.created_at.isoformat(),
            },
        )


# ============================================================
# Registry
# ============================================================

FORMATTERS: dict[ExportFormat, type[BaseFormatter]] = {
    ExportFormat.CSV: CSVFormatter,
    ExportFormat.JSON: JSONFormatter,
    ExportFormat.PARQUET: ParquetFormatter,
}

DESTINATIONS: dict[ExportDestinationType, type[BaseDestination]] = {
    ExportDestinationType.S3: S3Destination,
    ExportDestinationType.SFTP: SFTPDestination,
    ExportDestinationType.EMAIL: EmailDestination,
    ExportDestinationType.GOOGLE_SHEETS: GoogleSheetsDestination,
}


# ============================================================
# API Helpers
# ============================================================

def get_formatter(format_type: ExportFormat) -> BaseFormatter:
    """Get formatter instance for format type."""
    formatter_cls = FORMATTERS.get(format_type)
    if not formatter_cls:
        raise ValueError(f"Unsupported format: {format_type}")
    return formatter_cls()


def get_destination(dest_type: ExportDestinationType) -> BaseDestination:
    """Get destination instance for destination type."""
    dest_cls = DESTINATIONS.get(dest_type)
    if not dest_cls:
        raise ValueError(f"Unsupported destination: {dest_type}")
    return dest_cls()