/* Bản test "bắt đầu ở cấp cao".
 * Nạp file này TRƯỚC game.js:  <script src="capcao.js"></script><script src="game.js"></script>
 * Khi game tạo save mới (lần đầu chơi hoặc bấm "Chơi lại"), hàm fresh() trong game.js gọi window.CAPCAO(s)
 * để nâng save đó lên giữa game. Save cũ đang có thì KHÔNG bị đụng tới.
 * Bỏ thẻ <script src="capcao.js"> đi là game trở lại bình thường.
 *
 * Hàm này chạy bên trong fresh(), lúc đó mọi hằng số của game.js (ROSTER, RAR, LV, addIdol...) đã có sẵn.
 */
window.CAPCAO = function (s) {
  const CFG = {
    level: 2,            // 0 Phòng tập · 1 Studio · 2 Toà nhà riêng · 3 Big 4 · 4 Tổ hợp châu Á · 5 Đế chế Hallyu
    week: 80,            // Năm 2 · Tuần 28
    money: 3e9,          // 3 tỷ
    tickets: 30,         // vé casting
    equip: 6, mkt: 6,    // cấp đầu tư phòng tập / marketing
    idols: { UR: 3, SSR: 8, SR: 12, R: 13 }, // tổng 36 idol (kể cả 3 thực tập sinh ban đầu)
    groups: [            // tên, giới tính, số thành viên, fan, cúp, số bài, màu lightstick (null = chưa ra mắt)
      ["Velvet Bunny", "f", 5, 1.4e6, 18, 4, "#ff6fae"],
      ["Cosmic Wave",  "m", 4, 3.2e5,  6, 3, null],
      ["Mint Teen",    "f", 3, 4.5e4,  1, 1, null],
    ],
  };

  s.level = CFG.level; s.week = CFG.week; s.money = CFG.money; s.tickets = CFG.tickets;
  s.equip = CFG.equip; s.mkt = CFG.mkt;

  // 1) Thêm idol theo độ hiếm cho đủ số lượng
  const have = r => Object.keys(s.idols).filter(id => BY[id].rar === r).length;
  for (const [rar, n] of Object.entries(CFG.idols)) {
    const pool = ROSTER.filter(x => x.rar === rar && !s.idols[x.id]).sort(() => Math.random() - .5);
    for (let k = have(rar); k < n && pool.length; k++) addIdol(pool.pop().id);
  }

  // 2) Idol đã luyện tập lâu: chỉ số ~70–90% giới hạn, có sao, tinh thần tốt
  for (const id of Object.keys(s.idols)) {
    const i = s.idols[id];
    i.stars = ri(0, 3);
    i.joined = ri(1, CFG.week - 20);
    i.stam = 100; i.mind = ri(70, 95);
    const cap = capOf(id);
    STATS.forEach(([k]) => { i[k] = Math.max(i[k], Math.round(cap * (k === BY[id].spec ? .92 : rnd(.7, .85)))); });
  }

  // 3) Các nhóm đã debut, có fan, cúp, bài hát trên BXH
  const free = sex => Object.keys(s.idols)
    .filter(id => !s.idols[id].group && (male(id) ? "m" : "f") === sex)
    .sort((a, b) => idolTotal(b) - idolTotal(a));
  let wins = 0, singles = 0;
  for (const [name, sex, size, fanN, cup, nSong, ls] of CFG.groups) {
    const members = free(sex).slice(0, size);
    if (members.length < 2) continue;
    const g = { id: s.gid++, name, members, fans: Math.round(fanN), trophies: cup, songs: [],
                debut: CFG.week - ri(25, 60), acted: 0, lastSingle: CFG.week - ri(2, 6) };
    members.forEach(id => s.idols[id].group = g.id);
    for (let k = 0; k < nSong; k++) {
      const q = clamp(rnd(.6, .9), .05, .97);
      const song = { name: pick(W1) + " " + pick(W2), q, age: k * 3 + ri(1, 2) };
      // bài mới nhất ở top đầu, mỗi tuần tuổi tụt vài hạng (nhóm càng ít fan thì hạng càng thấp)
      song.rank = clamp(Math.min(chartRank(g, q), ri(2, 12) + Math.round(300000 / fanN)) + song.age * 5, 1, 100);
      g.songs.push(song);
    }
    if (ls) { g.ls = ls; g.lsSold = Math.round(fanN * .15); }
    s.groups.push(g);
    wins += cup; singles += nSong;
  }

  // 4) Thống kê + nhiệm vụ đã nhận, khớp với tiến độ trên
  Object.assign(s.st, { trains: 150, debuts: s.groups.length, busk: 40, singles, wins, concerts: 5,
                        tours: 0, pulls: 60, bestRank: 2, daesang: 0, earned: 4e9 });
  s.claimed = 15;        // đã nhận đến "Chuyển về Toà nhà riêng"; nhiệm vụ kế tiếp: World Tour
  s.company = "Thỏ Hồng Ent.";
  news("🧪 Bản test: công ty bắt đầu ở cấp Toà nhà riêng");
};
