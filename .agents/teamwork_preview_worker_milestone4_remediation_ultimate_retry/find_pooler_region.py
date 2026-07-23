import socket

regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
    "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1",
    "sa-east-1", "ca-central-1", "me-central-1", "af-south-1"
]

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        addr = socket.gethostbyname(host)
        print(f"Region {region}: {host} -> {addr}")
    except Exception:
        pass
