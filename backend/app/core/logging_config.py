import logging
import json
from logging.handlers import RotatingFileHandler

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record= {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        return json.dumps(log_record)

logger = logging.getLogger("task_app")
logger.setLevel(logging.INFO)

handler = RotatingFileHandler(
    "app.log",
    maxBytes=1_000_000,
    backupCount=5
)

handler.setFormatter(JsonFormatter())
logger.addHandler(handler)