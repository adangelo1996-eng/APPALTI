from loguru import logger
import sys


logger.remove()
logger.add(sys.stdout, serialize=False, backtrace=True, diagnose=False)


def get_logger():
    return logger

