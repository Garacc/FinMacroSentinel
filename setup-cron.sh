#!/bin/sh
# Simple cron scheduler with debug output

HOUR=$(date +%H)
MINUTE=$(date +%M)
DAY=$(date +%u)

# Debug: log every minute
echo "[DEBUG] Cron triggered at $HOUR:$MINUTE on day $DAY" >&2

# Only run on weekdays (1-5)
if [ "$DAY" -lt 1 ] || [ "$DAY" -gt 5 ]; then
    echo "[DEBUG] Not a weekday, skipping" >&2
    exit 0
fi

# Run at specific times: 6:00, 9:00, 12:00, 21:00
case "$HOUR:$MINUTE" in
    "6:00"|"9:00"|"12:00"|"21:00")
        echo "[DEBUG] Time matches, executing pipeline" >&2
        exec node /app/dist/index.js --schedule
        ;;
    *)
        echo "[DEBUG] Time $HOUR:$MINUTE not in schedule, skipping" >&2
        exit 0
        ;;
esac
