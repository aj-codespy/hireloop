from loguru import logger
try:
    1 / 0
except Exception as e:
    logger.error("error happened: %s", e, exc_info=True)
