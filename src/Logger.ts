import * as path from "path";
import * as winston from "winston";
import { format } from "date-fns";
import chalk from "chalk";

const { combine, timestamp, printf } = winston.format;

interface Printer {
  level: string;
  message: string;
  timestamp?: string;
}

function createFormater(color?: boolean) {
  return printf(({ level, message, timestamp }: Printer) => {
    const time = format(timestamp, "YYYY-MM-DD HH:mm:ss");
    return `${
      color ? chalk.green(time) : time
    } ${level.toUpperCase()}: ${message}`;
  });
}

const dirPath = path.join(process.cwd(), ".crawler");
const logDirPath = path.join(dirPath, "logs");
// logs
const infoLog = path.join(logDirPath, "info.log");
const errorLog = path.join(logDirPath, "error.log");

const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  format: combine(timestamp(), createFormater()),
  transports: [
    new winston.transports.File({ filename: infoLog, level: "info" }),
    new winston.transports.File({ filename: errorLog, level: "error" })
  ]
});

// if not production. print the log to console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: createFormater(true)
    })
  );
}

export { logger };
