type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const isServer = typeof window === 'undefined';
    const prefix = isServer ? '[SERVER]' : '[CLIENT]';
    
    let formattedData = '';
    if (data) {
      if (data instanceof Error) {
        formattedData = `\n${data.stack}`;
      } else {
        formattedData = `\n${JSON.stringify(data, null, 2)}`;
      }
    }
    
    return `${timestamp} ${prefix} [${level.toUpperCase()}] ${message}${formattedData}`;
  }

  info(message: string, data?: unknown) {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: unknown) {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, error?: unknown) {
    console.error(this.formatMessage('error', message, error));
  }

  debug(message: string, data?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

export const logger = new Logger();
