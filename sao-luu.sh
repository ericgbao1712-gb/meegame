#!/bin/sh
# Sao lưu SQLite an toàn khi máy chủ đang chạy. Cron mỗi đêm:
#   15 3 * * * /srv/meegame/sao-luu.sh
set -eu
mkdir -p /var/backups/meegame
sqlite3 /var/lib/meegame/meegame.db ".backup /var/backups/meegame/meegame-$(date +%F).db"
find /var/backups/meegame -name 'meegame-*.db' -mtime +30 -delete
