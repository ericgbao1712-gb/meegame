#!/bin/sh
# Cron của root, 5 phút một lần: */5 * * * * /srv/meegame/covers-sync/run.sh
# Chạy sync.py trong container tạm (user 10002, chỉ ghi được DB và thư mục covers).
exec flock -n /run/meegame-covers.lock docker run --rm --name meegame-covers-sync \
  --user 10002:10002 --read-only --tmpfs /tmp:size=16m --cap-drop ALL --security-opt no-new-privileges:true \
  --memory 384m --cpus 0.5 --pids-limit 32 --log-driver none \
  -v /srv/meegame/covers-sync/sync.py:/app/sync.py:ro \
  -v /var/lib/meegame:/data \
  -v /srv/meegame/web/covers:/covers \
  meegame-covers:1 python3 -I /app/sync.py >> /var/log/meegame-covers.log 2>&1
