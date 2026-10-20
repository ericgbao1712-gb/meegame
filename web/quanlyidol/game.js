/* ================== DỮ LIỆU ================== */
// [id, tên, nhóm gốc, sheet, ô, độ hiếm, sở trường]
const ROSTER = [
// [id, nghệ danh, nhóm gốc, ảnh (sprite assets/idols_<ảnh>.jpg, lưới 3×3), ô 0–8, độ hiếm, sở trường]
 ["euna","Euna","Velvet Crown","f1",0,"SSR","vi"],["aemi","Aemi","Velvet Crown","f1",1,"UR","ch"],["aera","Aera","Velvet Crown","f1",2,"UR","vo"],
 ["aebi","Aebi","Velvet Crown","f1",3,"UR","da"],["harae","Harae","NOVA-9","f1",4,"SSR","vi"],["saerin","Saerin","NOVA-9","f1",5,"SR","vo"],
 ["seosong","Seosong","NOVA-9","f1",6,"R","ch"],["nayul","Nayul","NOVA-9","f1",7,"R","vo"],["saera","Saera","Solo","f1",8,"SSR","vo"],
 ["yera","Yera","LUMI","f2",0,"SSR","vi"],["jaera","Jaera","LUMI","f2",1,"SR","ch"],["ahni","Ahni","Fresh Mint","f2",2,"SR","vi"],
 ["sirin","Sirin","Fresh Mint","f2",3,"SSR","ch"],["galin","Galin","Fresh Mint","f2",4,"SR","vi"],["chaehee","Chaehee","Fresh Mint","f2",5,"R","vo"],
 ["soyul","Soyul","Candy Parade","f2",6,"SR","ch"],["rion","Rion","Candy Parade","f2",7,"SR","vo"],["yeonni","Yeonni","Candy Parade","f2",8,"SR","vi"],
 ["raechan","Raechan","Seven Tides","m1",0,"SSR","ch"],["daeseok","Daeseok","Seven Tides","m1",1,"SSR","vi"],["sunggyu","Sunggyu","Seven Tides","m1",2,"SSR","ch"],
 ["kiil","Kiil","Seven Tides","m1",3,"SSR","da"],["sunghan","Sunghan","Seven Tides","m1",4,"UR","da"],["junjun","Junjun","Seven Tides","m1",5,"UR","vi"],
 ["jaeon","Jaeon","Seven Tides","m1",6,"UR","vo"],["haon","Haon","Thunderline","m1",7,"SSR","ch"],["joongun","Joongun","Orbit Boys","m1",8,"SSR","vi"],
 ["howoo","Howoo","Wild Compass","m2",0,"SSR","da"],["seungho","Seungho","Wild Compass","m2",1,"SR","da"],["sibin","Sibin","Wild Compass","m2",2,"SR","vo"],
 ["joonho","Joonho","Thirteen Lights","m2",3,"SR","vi"],["woohan","Woohan","Thirteen Lights","m2",4,"R","vi"],["raerae","Raerae","Neo Circuit","m2",5,"R","da"],
 ["beomhyun","Beomhyun","Neo Circuit","m2",6,"R","ch"],["yogun","Yogun","Glimmer","m2",7,"SR","da"],["kiwoo","Kiwoo","Eclipse","m2",8,"SR","vo"],
 ["danlin","Danlin","Candy Parade","f3",0,"SR","da"],["yumi","Yumi","Candy Parade","f3",1,"SR","da"],["eunrae","Eunrae","Candy Parade","f3",2,"SR","vo"],
 ["suyul","Suyul","Candy Parade","f3",3,"R","ch"],["danbin","Danbin","Candy Parade","f3",4,"R","ch"],["sohwa","Sohwa","Candy Parade","f3",5,"R","vo"],
 ["danra","Danra","Berry Ribbon","f3",6,"SSR","vi"],["harin","Harin","Berry Ribbon","f3",7,"SSR","da"],["hyelin","Hyelin","Berry Ribbon","f3",8,"SR","vo"],
 ["ririn","Ririn","Berry Ribbon","f4",0,"SR","ch"],["sora","Sora","Berry Ribbon","f4",1,"R","ch"],["gabin","Gabin","LUMI","f4",2,"R","da"],
 ["subi","Subi","LUMI","f4",3,"R","ch"],["ralin","Ralin","LUMI","f4",4,"R","vo"],["risong","Risong","LUMI","f4",5,"R","vi"],
 ["ria","Ria","Fresh Mint","f4",6,"R","vi"],["hami","Hami","Iron Petal","f4",7,"SSR","ch"],["soju","Soju","Iron Petal","f4",8,"SR","ch"],
 ["yesong","Yesong","Iron Petal","f5",0,"SR","vo"],["hahee","Hahee","Iron Petal","f5",1,"SR","da"],["boa","Boa","Iron Petal","f5",2,"R","ch"],
 ["chaera","Chaera","Midnight Queens","f5",3,"SR","vo"],["hyebi","Hyebi","Midnight Queens","f5",4,"SR","vo"],["yurae","Yurae","Midnight Queens","f5",5,"SSR","ch"],
 ["rana","Rana","Midnight Queens","f5",6,"SR","ch"],["seolyul","Seolyul","Midnight Queens","f5",7,"R","vi"],["yeonhwa","Yeonhwa","Zip Zap","f5",8,"SSR","da"],
 ["ahrae","Ahrae","Zip Zap","f6",0,"R","vo"],["ahlin","Ahlin","Zip Zap","f6",1,"SR","da"],["chaeah","Chaeah","Zip Zap","f6",2,"R","da"],
 ["yurin","Yurin","Zip Zap","f6",3,"SR","vi"],["gaju","Gaju","Starry Era","f6",4,"UR","vo"],["chaeeun","Chaeeun","Starry Era","f6",5,"UR","vi"],
 ["seohwa","Seohwa","Mellow Moon","f6",6,"SSR","ch"],["ahbin","Ahbin","Mellow Moon","f6",7,"SR","vo"],["ahri","Ahri","Mellow Moon","f6",8,"R","ch"],
 ["ahmi","Ahmi","Wildling","f7",0,"SSR","vo"],["raeun","Raeun","Wildling","f7",1,"R","da"],["rieun","Rieun","Wildling","f7",2,"R","vi"],
 ["jaeeun","Jaeeun","Pastel Wish","f7",3,"R","ch"],["sina","Sina","Pastel Wish","f7",4,"R","vi"],["eunmi","Eunmi","Lip Gloss","f7",5,"R","da"],
 ["ahrin","Ahrin","Lip Gloss","f7",6,"R","ch"],["rahwa","Rahwa","Solo","f7",7,"SR","ch"],["dayul","Dayul","Solo","f7",8,"SSR","da"],
 ["habi","Habi","Sweet Static","f8",0,"R","vo"],["aeeun","Aeeun","Sweet Static","f8",1,"R","vi"],["sia","Sia","Remix Club","f8",2,"R","vo"],
 ["sura","Sura","Remix Club","f8",3,"SR","vo"],["rahee","Rahee","Remix Club","f8",4,"R","vi"],["gaon","Gaon","Solo","f8",5,"R","ch"],
 ["jaeni","Jaeni","Solo","f8",6,"R","ch"],["suri","Suri","Solo","f8",7,"UR","vi"],["yuhwa","Yuhwa","Solo","f8",8,"SSR","ch"],
 ["wooho","Wooho","Thirteen Lights","m3",0,"SR","ch"],["wooyul","Wooyul","Thirteen Lights","m3",1,"SR","vo"],["seungwoo","Seungwoo","Thirteen Lights","m3",2,"R","da"],
 ["jaeil","Jaeil","Thirteen Lights","m3",3,"SR","da"],["hyunjae","Hyunjae","Thirteen Lights","m3",4,"SR","vi"],["hyungyu","Hyungyu","Thirteen Lights","m3",5,"SR","vo"],
 ["kiho","Kiho","Thirteen Lights","m3",6,"R","vo"],["seonhan","Seonhan","Thirteen Lights","m3",7,"R","vo"],["woowoo","Woowoo","Thirteen Lights","m3",8,"R","ch"],
 ["daeon","Daeon","Wild Compass","m4",0,"SR","da"],["joonhan","Joonhan","Wild Compass","m4",1,"R","ch"],["hahwi","Hahwi","Wild Compass","m4",2,"SR","vo"],
 ["junho","Junho","Wild Compass","m4",3,"R","vo"],["kion","Kion","Wild Compass","m4",4,"R","vi"],["joonrae","Joonrae","Thirteen Lights","m4",5,"R","da"],
 ["siyul","Siyul","Thirteen Lights","m4",6,"R","da"],["joongyu","Joongyu","Eclipse","m4",7,"SSR","da"],["beomho","Beomho","Eclipse","m4",8,"SR","ch"],
 ["onhan","Onhan","Eclipse","m5",0,"SSR","vi"],["taejae","Taejae","Eclipse","m5",1,"SSR","vo"],["siwon","Siwon","Eclipse","m5",2,"SR","vo"],
 ["kanggyu","Kanggyu","Eclipse","m5",3,"R","vo"],["taeseok","Taeseok","Neo Circuit","m5",4,"SSR","vi"],["jaehwi","Jaehwi","Neo Circuit","m5",5,"SR","vo"],
 ["raehan","Raehan","Neo Circuit","m5",6,"SR","vo"],["kangyul","Kangyul","Neo Circuit","m5",7,"SR","vi"],["seungil","Seungil","Neo Circuit","m5",8,"SR","vi"],
 ["hyunhwi","Hyunhwi","Neo Circuit","m6",0,"R","vo"],["kihan","Kihan","Neo Circuit","m6",1,"R","vo"],["sungho","Sungho","Neo Circuit","m6",2,"R","da"],
 ["kirae","Kirae","Jade Wave","m6",3,"SR","da"],["hwanjae","Hwanjae","Daydream Club","m6",4,"SR","vi"],["sunggun","Sunggun","Daydream Club","m6",5,"SSR","da"],
 ["seunggun","Seunggun","Daydream Club","m6",6,"SR","ch"],["hyunwoo","Hyunwoo","Daydream Club","m6",7,"R","vo"],["sihwi","Sihwi","Daydream Club","m6",8,"R","ch"],
 ["kijun","Kijun","Blue Hour","m7",0,"SR","ch"],["jungun","Jungun","Blue Hour","m7",1,"SR","vo"],["seonho","Seonho","Blue Hour","m7",2,"R","ch"],
 ["sungwoo","Sungwoo","Blue Hour","m7",3,"R","ch"],["kanghyun","Kanghyun","Blue Hour","m7",4,"SR","vi"],["sungchan","Sungchan","Blue Hour","m7",5,"R","vi"],
 ["hwanchan","Hwanchan","Blue Hour","m7",6,"R","da"],["taeyul","Taeyul","Thunderline","m7",7,"UR","vo"],["hoyul","Hoyul","Thunderline","m7",8,"SSR","ch"],
 ["joonhyun","Joonhyun","Glimmer","m8",0,"SR","ch"],["hwangyu","Hwangyu","Glimmer","m8",1,"SR","vi"],["raegun","Raegun","Glimmer","m8",2,"SR","vo"],
 ["kiyul","Kiyul","Storm Riders","m8",3,"SR","ch"],["yobin","Yobin","Storm Riders","m8",4,"R","vi"],["yoil","Yoil","Storm Riders","m8",5,"R","da"],
 ["woogyu","Woogyu","Storm Riders","m8",6,"SR","da"],["seunghan","Seunghan","Storm Riders","m8",7,"R","da"],["junseok","Junseok","Solo","m8",8,"SSR","da"],
].map(([id,name,from,sheet,idx,rar,spec])=>({id,name,from,sheet,idx,rar,spec}));
const BY = Object.fromEntries(ROSTER.map(r=>[r.id,r]));
const RAR = {R:{base:18,cap:60,rate:45,salary:1},SR:{base:26,cap:75,rate:35,salary:1.5},SSR:{base:34,cap:90,rate:16,salary:2.5},UR:{base:42,cap:105,rate:4,salary:4}};
const ic=(n,c="")=>`<img class="ic ${c}" src="assets/ic/${n}.png" alt="">`;
const STATS = [["vo","Vocal","#ff6fae",ic("vocal")],["da","Dance","#a98bff",ic("dance")],["vi","Visual","#ffb938",ic("visual")],["ch","Sức hút","#3fcf9f",ic("charm")]];
// idols = sức chứa ký túc xá · groups = số nhóm được debut · cap = sức chứa concert · tour = khán giả tối đa/thành phố · fx = bộ lọc màu ảnh nền
const LV = [
 {name:"Phòng tập tầng hầm",bg:"bg_room",idols:16,groups:2,rent:2e5,cap:1500},
 {name:"Studio Ent.",bg:"bg_studio",idols:36,groups:4,rent:2e6,cap:8000,cost:8e7,fans:15e3},
 {name:"Toà nhà riêng",bg:"bg_hq",idols:64,groups:6,rent:2e7,cap:4e4,cost:8e8,fans:2e5},
 {name:"Tập đoàn Big 4",bg:"bg_hq",idols:110,groups:9,rent:1e8,cap:1.5e5,cost:2e10,fans:3e6,fx:"saturate(1.3) hue-rotate(-15deg)"},
 {name:"Tổ hợp giải trí châu Á",bg:"bg_stage",idols:130,groups:12,rent:3e8,cap:5e5,tour:8e4,cost:1.5e11,fans:2e7,fx:"saturate(1.2) hue-rotate(25deg)"},
 {name:"Đế chế Hallyu toàn cầu",bg:"bg_mv",idols:144,groups:16,rent:1e9,cap:2e6,tour:1.5e5,cost:1e12,fans:1e8,fx:"saturate(1.4) hue-rotate(-40deg)"},
];
const WEEK_MS=7*60*1000, OFFLINE_MAX=26; // 7 phút thật = 1 tuần trong game; vắng mặt tính bù tối đa 26 tuần (~3 giờ)
const WEEK_MIN=WEEK_MS/6e4;
const MAX_MEMBERS=11, STK_PER_DAY=6, STK_PER_WHO=2, MV_COOLDOWN=1; // thành viên tối đa/nhóm · sticker/ngày · sticker/người/ngày · số tuần chờ giữa 2 MV
const ACTS = {
 busk:{name:"Hát đường phố",icon:ic("busk"),st:15,mind:1,desc:"Miễn phí. Kiếm fan và chút tiền."},
 single:{name:"Phát hành MV",icon:ic("single"),st:20,mind:3,desc:"Ra bài mới kèm MV, leo BXH, thu tiền nhiều tuần."},
 show:{name:"Show âm nhạc",icon:ic("show"),st:25,mind:3,desc:"Cần đã có bài hát. Thắng sẽ nhận cúp #1."},
 fanmeet:{name:"Fan meeting",icon:ic("fanmeet"),st:10,mind:0,desc:"Gặp fan: cả nhóm +12 tinh thần, thêm fan. Cần 300 fan."},
 concert:{name:"Concert",icon:ic("concert"),st:35,mind:4,desc:"Cần 10K fan. Bán vé kiếm lớn."},
 tour:{name:"World Tour",icon:ic("tour"),st:50,mind:8,desc:"Cần Toà nhà riêng và 300K fan."},
 rest:{name:"Nghỉ ngơi",icon:ic("rest"),st:0,mind:0,desc:"Cả nhóm hồi +40 thể lực, +15 tinh thần."},
};
/* ---------- Cộng đồng mạng: mẫu bình luận ({n}=idol, {g}=nhóm, {s}=bài hát) ---------- */
const PLAT=[["StarBoard","#5f8bff"],["Gossip Hub","#ff7a45"],["X","#2b2b2b"],["YouTube","#ff3b3b"],["TikTok","#161616"],["FanTalk","#1fbfbf"],["Idol Forum","#9b6bff"]];
const TXT={
 busk:["Đang đi Hongdae thì nghe {g} hát, đứng hình luôn 😭","Hát rong mà như concert, ai cho tui xin tên nhóm với!!","Tình cờ quay được clip này, idol tương lai đây rồi","Giọng live sạch ghê, chẳng cần autotune","Đứng nghe 3 bài liền quên cả về nhà"],
 single:["“{s}” nghe lần đầu thấy lạ, lần ba là nghiện 🎧","MV màu đẹp như phim, đạo diễn xứng đáng tăng lương","Điệp khúc “{s}” dính trong đầu cả ngày rồi","Bài hát của mùa này chính là “{s}”","Stream “{s}” thôi mọi người ơi!! 🔥"],
 show:["Sân khấu hôm nay của {g} đỉnh nóc kịch trần","Camera đài hôm nay quay trúng hết khoảnh khắc đẹp","Fanchant to quá, nghe là biết fandom mạnh","Encore mà vẫn hát live ổn định, nể thật","{g} diễn xong mà khán giả vẫn hò hét không ngừng"],
 concert:["Vừa đi concert về mà tim vẫn đập thình thịch 😭 {g} ơi yêu mọi người","Âm thanh, ánh sáng, setlist đều 10/10","Biển lightstick đẹp như dải ngân hà","Xếp hàng mua vé 3 tiếng nhưng đáng từng giây","Đoạn {n} khóc lúc nói lời cảm ơn làm cả hội trường khóc theo"],
 tour:["{g} diễn ở thành phố tui rồi, không tin nổi 😭","Fan quốc tế hát theo tiếng Hàn không sai chữ nào","Tour này phải lên phim tài liệu","{g} chính thức là nhóm toàn cầu rồi"],
 fanmeet:["{n} nhớ cả tên tui luôn á 😭😭","Fanmeeting ấm áp quá, idol với fan như gia đình","Được {n} bắn tim trực tiếp, xỉu tại chỗ","Mấy trò chơi hôm nay buồn cười muốn xỉu","{n} ký tặng còn vẽ thêm hình thỏ, cưng xỉu"],
 offfan:["Off fan hôm nay {n} tự tay rót trà cho fan, cưng muốn xỉu 😭","Không ngờ {g} xuất hiện ở off fan, cả quán hét ầm lên","Banner tụi mình làm được {n} chụp hình cùng luôn!!","Off fan nhỏ xinh mà ấm áp, yêu fandom này ghê","{n} nhớ cả nickname của tui trên FanTalk 🥹"],
 lsale:["Lightstick của {g} đẹp xỉu, bấm mua trong 0.5 giây","Server sập vì mua lightstick {g}, fandom đông quá trời","Màu lightstick độc quyền xinh ghê, đi concert sẽ đẹp lắm","Mua 2 cây, 1 cây để dùng, 1 cây để thờ 🙏","Chờ mãi mới có lightstick chính thức, cảm ơn công ty!"],
 debut:["Tân binh mà kỹ năng như tiền bối 5 năm","Debut stage mà không run chút nào, đỉnh","Đánh dấu ngày {g} debut, sau này khoe đã stan từ đầu","Concept debut độc lạ, công ty có tâm ghê","Thêm một nhóm tân binh đáng theo dõi"],
 vo:["Nốt cao của {n} ở đoạn bridge làm tui nổi da gà","{n} hát live như nuốt đĩa, main vocal thực thụ","Giọng {n} ấm áp quá, nghe là thấy chữa lành"],
 da:["{n} nhảy như cái máy, mạnh mà vẫn mềm mại","Đoạn dance break của {n} phải xem lại 10 lần","Đường nét vũ đạo của {n} sạch sẽ quá trời"],
 vi:["{n} là visual đỉnh nhất thế hệ này, không cãi","Fancam của {n} chắc chắn sẽ triệu view","Nhan sắc {n} hôm nay như bước ra từ truyện tranh"],
 ch:["Ánh mắt của {n} qua camera là tui đổ luôn","{n} có sức hút lạ kỳ, nhìn mãi không chán","Biểu cảm của {n} đúng chuẩn ending fairy 🧚"],
 neu:["Cũng được, chưa đột phá lắm","Concept lần này hơi giống nhóm khác nhỉ?","Nhóm này mới à? Để nghe thử xem sao","Tạm ổn, chờ lần comeback sau","Trang phục hơi lạ nhưng nhìn lâu cũng hợp"],
 nvo:["{n} hát live hơi chênh phô, cần luyện vocal thêm","Giọng {n} hụt hơi ở điệp khúc rồi"],
 nda:["{n} nhảy hơi lệch nhịp so với cả nhóm","{n} trông lóng ngóng ở đoạn đổi đội hình"],
 nvi:["{n} đứng góc suốt, chẳng ai để ý","Biểu cảm của {n} hơi đơ"],
 flop:["Flop rồi, chẳng ai nghe đâu","Bài này nhạt quá, công ty chọn bài kém","Nghe xong quên luôn giai điệu"],
 hate:["{n} rời nhóm đi, đang kéo cả nhóm đi xuống","Sao {n} được debut vậy? Chẳng thấy tài năng gì","{n} toàn được chia nhiều line mà hát dở","{n} chỉ đứng làm cảnh thôi à","Không hiểu sao ai cũng khen {n}, thấy bình thường mà 😒"],
 def:["Anti tránh xa {n} ra! Đừng bắt nạt idol nhà tui 😤","Báo cáo hết bình luận ác ý thôi mọi người","{n} đã cố gắng rất nhiều rồi, tôn trọng chút đi","Fandom ơi bảo vệ {n} nào 💜"],
 concern:["Sao {n} trông mệt mỏi thế? Công ty có cho idol nghỉ không 😢","Ánh mắt {n} hôm nay buồn quá, mong em vẫn ổn","{n} cười gượng quá, lo ghê","Công ty làm ơn chăm sóc sức khoẻ tinh thần cho {n}!!"],
};
const USERS=["ㅇㅇ","익명","kpopholic","starlight_99","bubbletea.lover","fan_since_day1","hongdae_walker","melody_chart","stream_now","sunflower.07","moonchild","lightstick_army","daily.dose.kpop","ultstan","pinkpuffy"];
/* ---------- Chăm sóc sức khoẻ tinh thần: [mã, icon, tên, chi phí gốc, +tinh thần, mô tả] ---------- */
const CARE=[
 ["chat","chat","Trò chuyện riêng với CEO",0,8,"Lắng nghe tâm sự và động viên. Miễn phí."],
 ["letter","letter","Đọc thư tay của fan",0,12,"Cần nhóm có từ 5K fan. Miễn phí."],
 ["bbq","bbq","Đãi cả nhóm đi ăn thịt nướng",2e6,10,"Mọi thành viên trong nhóm cùng +10."],
 ["therapy","therapy","Gặp chuyên gia tâm lý",5e6,30,"Tư vấn chuyên nghiệp, hiệu quả cao."],
 ["trip","vacation","Kỳ nghỉ ở Jeju (vắng 1 tuần)",1.5e7,100,"Hồi đầy tinh thần và thể lực, nghỉ hoạt động 1 tuần."],
];
const RIVALS = [["Big Moon Ent",4e6],["Starwave Music",2.5e6],["Bloom Ent",1.2e6],["Nova Label",6e5],["Cherry Pop",2.5e5],["Blue Whale",1e5],["Pixel Ent",4e4],["Sunny Side",1.2e4],["Mây Trắng Ent",3e3]];
const W1=["Candy","Pink","Dream","Bounce","Starlight","Bubble","Fever","Sugar","Moonlight","Crush","Butterfly","Shine","Cherry","Neon","Velvet","Honey","Lemon","Galaxy"];
const W2=["Pop","Bomb","Day","Wave","Kiss","Rush","Up","Night","Party","Light","Love","Boom","Diary","Summer","Code","Drive"];
const G1=["Pink","Star","Moon","Lucky","Velvet","Sugar","Neon","Bloom","Crystal","Honey","Cosmic","Ruby","Mint","Aurora","Blue"];
const G2=["Bunny","Rush","Heart","Teen","Dream","Wave","Kiss","Seven","Beat","Bloom","Flare","Note","Day","Unit","Crew"];

const MISSIONS = [
 ["Ký hợp đồng 4 thực tập sinh", s=>own().length>=4, {money:3e6}],
 ["Luyện tập 5 lần", s=>s.st.trains>=5, {tickets:1}],
 ["Debut nhóm đầu tiên", s=>s.st.debuts>=1, {money:5e6}],
 ["Hát đường phố 3 lần", s=>s.st.busk>=3, {money:2e6}],
 ["Phát hành single đầu tiên", s=>s.st.singles>=1, {tickets:1}],
 ["Đạt 2.000 fan", s=>totalFans()>=2000, {money:5e6}],
 ["Thắng #1 show âm nhạc", s=>s.st.wins>=1, {tickets:2}],
 ["Nâng cấp lên Studio", s=>s.level>=1, {tickets:3}],
 ["Sưu tập 10 idol", s=>own().length>=10, {money:2e7}],
 ["Tổ chức concert đầu tiên", s=>s.st.concerts>=1, {tickets:3}],
 ["Debut nhóm thứ 2", s=>s.st.debuts>=2, {money:3e7}],
 ["Đạt 100.000 fan", s=>totalFans()>=1e5, {tickets:5}],
 ["Có single lọt Top 10", s=>s.st.bestRank<=10, {money:5e7}],
 ["Giành 10 cúp show âm nhạc", s=>s.st.wins>=10, {tickets:5}],
 ["Chuyển về Toà nhà riêng", s=>s.level>=2, {tickets:10}],
 ["Tổ chức World Tour", s=>s.st.tours>=1, {money:5e8}],
 ["Sưu tập 25 idol", s=>own().length>=25, {tickets:10}],
 ["Thắng giải Daesang", s=>s.st.daesang>=1, {money:1e9}],
 ["Trở thành Tập đoàn Big 4", s=>s.level>=3, {tickets:20}],
 ["Sưu tập 60 idol", s=>own().length>=60, {money:5e9}],
 // ---- Level 4 · Ông lớn K-pop ----
 ["Vận hành 5 nhóm cùng lúc", s=>s.groups.length>=5, {money:3e9}],
 ["Debut một nhóm từ 9 thành viên trở lên", s=>s.groups.some(g=>g.members.length>=9), {tickets:15}],
 ["Hạng #1 BXH công ty", s=>myRank()===1, {money:1e10}],
 ["Giành 50 cúp show âm nhạc", s=>s.st.wins>=50, {tickets:15}],
 ["Tổ chức 5 World Tour", s=>s.st.tours>=5, {money:2e10}],
 ["Sưu tập 100 idol", s=>own().length>=100, {money:2e10}],
 ["Có single hạng #1 BXH nhạc số", s=>s.st.bestRank<=1, {tickets:20}],
 ["Mở rộng thành Tổ hợp giải trí châu Á", s=>s.level>=4, {tickets:25}],
 // ---- Level 5 · Đế chế châu Á ----
 ["Một nhóm đạt 10 triệu fan", s=>s.groups.some(g=>g.fans>=1e7), {money:5e10}],
 ["Debut nhóm đủ 11 thành viên", s=>s.groups.some(g=>g.members.length>=11), {tickets:20}],
 ["Vận hành 9 nhóm cùng lúc", s=>s.groups.length>=9, {money:8e10}],
 ["Tổ chức 30 concert", s=>s.st.concerts>=30, {tickets:25}],
 ["Thắng 2 giải Daesang", s=>s.st.daesang>=2, {money:1e11}],
 ["Tổng 30 triệu fan", s=>totalFans()>=3e7, {tickets:30}],
 ["Sưu tập 120 idol", s=>own().length>=120, {money:1e11}],
 ["Trở thành Đế chế Hallyu toàn cầu", s=>s.level>=5, {tickets:40}],
 // ---- Level 6 · Huyền thoại Hallyu ----
 ["Vận hành 14 nhóm cùng lúc", s=>s.groups.length>=14, {money:3e11}],
 ["Tổng 100 triệu fan", s=>totalFans()>=1e8, {tickets:40}],
 ["Giành 300 cúp show âm nhạc", s=>s.st.wins>=300, {money:4e11}],
 ["Tổ chức 30 World Tour", s=>s.st.tours>=30, {tickets:50}],
 ["Thắng 4 giải Daesang", s=>s.st.daesang>=4, {money:5e11}],
 ["Sưu tập đủ toàn bộ idol", s=>own().length>=ROSTER.length, {money:1e12,tickets:100}],
];
/* Chia chuỗi nhiệm vụ thành các Level: [chỉ số nhiệm vụ đầu tiên, tên Level, thưởng khi hoàn thành cả Level]. */
const QLV = [
 [0,"Tân binh",{tickets:2}],
 [8,"Ngôi sao đang lên",{money:5e7,tickets:3}],
 [15,"Thế lực mới",{money:1e9,tickets:10}],
 [20,"Ông lớn K-pop",{money:2e10,tickets:20}],
 [28,"Đế chế châu Á",{money:2e11,tickets:40}],
 [36,"Huyền thoại Hallyu",{money:2e12,tickets:100}],
];
const qlvOf=i=>{let k=0;QLV.forEach((x,j)=>{if(i>=x[0])k=j});return k};
const qlvEnd=k=>(QLV[k+1]||[MISSIONS.length])[0];

/* ================== TRẠNG THÁI ================== */
const KEY="kpopceo_v1";
let S, tab="home", ui={pick:[],gname:""};
function fresh(){
  const s={week:1,money:1e7,tickets:1,level:0,equip:0,mkt:0,care:0,feed:[],sched:[],sid:1,company:"Thỏ Hồng Ent.",idols:{},groups:[],
    st:{trains:0,debuts:0,busk:0,singles:0,wins:0,concerts:0,tours:0,pulls:0,bestRank:999,daesang:0,earned:0},
    pity:0,claimed:0,news:[],rivals:RIVALS.map(([n,v])=>({n,v})),daily:"",streak:0,lastSeen:Date.now(),weekStart:Date.now(),seenIntro:false,gid:1};
  S=s;
  addIdol(pickRar("R"),true); addIdol(pickRar("R"),true); addIdol(pickRar("SR"),true);
  if(typeof window.CAPCAO==="function") window.CAPCAO(s); // bản test: capcao.js nâng save mới lên cấp cao
  return s;
}
function load(){
  try{const raw=localStorage.getItem(KEY); if(raw){S=JSON.parse(raw);if(!S.weekStart)S.weekStart=Date.now();migrate();return true}}catch(e){}
  fresh(); return false;
}
function migrate(){S.care=S.care||0;S.feed=S.feed||[];S.sched=S.sched||[];S.sid=S.sid||1;Object.values(S.idols).forEach(i=>{if(i.mind==null)i.mind=80});migrateIds()}
/* Save từ bản cũ dùng id khác (trước khi đổi tên idol). Bảng MIG: mã băm của id cũ → id mới, nên code không chứa tên cũ.
   Id không có trong bảng (vd idol thêm thử ở bản 20/10 rồi gỡ) bị bỏ khỏi save. */
const MIG={3705411:"sora",101135348:"euna",3131351703:"aemi",3506511:"aera",3321995:"aebi",3156401280:"harae",3507230405:"saerin",38980529:"seosong",381925224:"nayul",3372:"saera",4229035842:"yera",115336819:"jaera",103900945:"ahni",99045136:"sirin",3070135051:"galin",1625177944:"chaehee",3522689:"soyul",3242493470:"rion",110879243:"yeonni",3643:"raechan",105231:"daeseok",3541692:"sunggyu",101101734:"kiil",101129395:"sunghan",118:"junjun",4060644484:"jaeon",3293:"haon",3002991129:"joongun",97315196:"howoo",1386663781:"seungho",2432613770:"sibin",3220927025:"joonho",2780454952:"woohan",2745230055:"raerae",3344077:"beomhyun",3413680058:"yogun",2178811407:"kiwoo",3357380:"danlin",3351631:"yumi",101125087:"eunrae",2955714919:"suyul",1214539887:"danbin",295268024:"sohwa",100466451:"danra",3389220619:"harin",113016821:"hyelin",105428:"ririn",98113186:"gabin",112790:"subi",107165:"ralin",3188346577:"risong",99751321:"ria",738691245:"hami",3385237607:"soju",3575561469:"yesong",3156650954:"hahee",2897808903:"boa",3221252487:"chaera",3220933240:"hyebi",3398568519:"yurae",3720756:"rana",3391987764:"seolyul",3705163:"yeonhwa",107140:"ahrae",3379060033:"ahlin",3099353907:"chaeah",3720655:"yurin",2745220483:"gaju",115163020:"chaeeun",99688192:"seohwa",109618625:"ahbin",3998888879:"ahri",2876779154:"ahmi",3512025:"raeun",3686678477:"rieun",3512759986:"jaeeun",722330007:"sina",104592230:"eunmi",101485917:"ahrin",3536120:"rahwa",757414178:"dayul",109433768:"habi",104567:"aeeun",3070140042:"sia",3321802:"sura",2513844695:"rahee",96870021:"gaon",3705279:"jaeni",3542305:"suri",99766839:"yuhwa",3387203769:"wooho",3140730470:"wooyul",105603:"seungwoo",99466829:"jaeil",3512774721:"hyunjae",113316358:"hyungyu",3207:"kiho",2237701621:"seonhan",3475020874:"woowoo",54266519:"daeon",1432414610:"joonhan",103061:"hahwi",1457658742:"junho",3365:"kion",3083526:"joonrae",3558887:"siyul",105939:"joongyu",1432953915:"beomho",109317487:"onhan",3211:"taejae",3541737:"siwon",3536061486:"kanggyu",2459631224:"taeseok",1849059437:"jaehwi",684457950:"raehan",3258428:"kangyul",3127388548:"seungil",3360381448:"hyunhwi",2933450183:"kihan",3135201626:"sungho",114717:"kirae",3398267540:"hwanjae",3011200696:"sunggun",4073419970:"seunggun",2744733442:"hyunwoo",1900821671:"sihwi",3040494034:"kijun",3308080980:"jungun",104994:"seonho",3254481:"sungwoo",2565978945:"kanghyun",109799724:"sungchan",3381337:"hwanchan",2745216601:"taeyul",115029:"hoyul",106079:"joonhyun",103900889:"hwangyu",3415761:"raegun",3072985603:"kiyul",1285879452:"yobin",115340633:"yoil",113632:"woogyu",4257664993:"seunghan",3828519918:"junseok"};
function idHash(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h}
function migrateIds(){
  const ren=id=>BY[id]?id:(MIG[idHash(id)]||null);
  if(Object.keys(S.idols).every(id=>BY[id])) return;
  const n={}; for(const [id,v] of Object.entries(S.idols)){const k=ren(id); if(k&&!n[k]&&!(BY[id]===undefined&&S.idols[k])) n[k]=v} S.idols=n; // không ghi đè idol đã có
  S.groups.forEach(g=>g.members=g.members.map(ren).filter(id=>id&&S.idols[id]));
  S.groups=S.groups.filter(g=>{if(g.members.length>=2)return true; g.members.forEach(id=>S.idols[id].group=null); news(`💔 ${esc(g.name)} tan rã vì không đủ thành viên`); return false});
  S.sched=S.sched.filter(e=>e.who.startsWith("g:")||ren(e.who)).map(e=>e.who.startsWith("g:")?e:{...e,who:ren(e.who)});
  if(S.flags&&S.flags.rumor) S.flags.rumor=ren(S.flags.rumor);
}
let saveT; function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{S.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}},200)}

/* ================== TIỆN ÍCH ================== */
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function money(v){const n=Math.abs(v),sg=v<0?"-":"";
  if(n>=1e9) return sg+(n/1e9).toLocaleString("vi-VN",{maximumFractionDigits:n>=1e11?0:1})+" tỷ";
  if(n>=1e6) return sg+(n/1e6).toLocaleString("vi-VN",{maximumFractionDigits:n>=1e8?0:1})+" tr";
  return sg+Math.round(n/1e3).toLocaleString("vi-VN")+"k"}
function fans(v){v=Math.round(v); if(v>=1e6) return (v/1e6).toLocaleString("vi-VN",{maximumFractionDigits:1})+"M"; if(v>=1e4) return (v/1e3).toLocaleString("vi-VN",{maximumFractionDigits:1})+"K"; return v.toLocaleString("vi-VN")}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const own=()=>Object.keys(S.idols);
const totalFans=()=>S.groups.reduce((a,g)=>a+g.fans,0);
const lv=()=>LV[S.level];
const yearWeek=()=>`Năm ${Math.floor((S.week-1)/52)+1} · Tuần ${((S.week-1)%52)+1}`;
function news(t){S.news.unshift(`<b>T${S.week}</b> · ${t}`);S.news.length=Math.min(S.news.length,30)}
function toast(t){const d=document.createElement("div");d.className="toast";d.innerHTML=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2500)}
function confetti(n=60){const cs=["#ff6fae","#a98bff","#3fcf9f","#ffb938","#8fb4ff"];for(let i=0;i<n;i++){const c=document.createElement("i");c.className="conf";c.style.left=rnd(0,100)+"vw";c.style.background=pick(cs);c.style.animationDuration=rnd(1.6,3.2)+"s";c.style.animationDelay=rnd(0,.5)+"s";document.body.appendChild(c);setTimeout(()=>c.remove(),4000)}}

/* ================== IDOL ================== */
function pickRar(r){return pick(ROSTER.filter(x=>x.rar===r&&!S.idols[x.id])||ROSTER).id}
function capOf(id){return RAR[BY[id].rar].cap+S.idols[id].stars*8}
function addIdol(id){
  const r=BY[id], b=RAR[r.rar].base, i={stars:0,stam:100,mind:80,group:null,joined:S.week,off:0};
  STATS.forEach(([k])=>i[k]=b+ri(0,8)+(k===r.spec?12:0));
  S.idols[id]=i;
}
const isOff=id=>(S.idols[id].off||0)>S.week;
const male=id=>BY[id].sheet[0]==="m";
/* ---------- Sức khoẻ tinh thần ---------- */
const mindOf=id=>S.idols[id]&&S.idols[id].mind!=null?S.idols[id].mind:80;
function moodOf(v){return v>=75?["😄","Hạnh phúc","#3fcf9f"]:v>=50?["🙂","Ổn định","#8fb4ff"]:v>=25?["😟","Căng thẳng","#ffb938"]:["😢","Kiệt quệ","#ff5d73"]}
function addMind(id,v){const i=S.idols[id];if(i)i.mind=clamp(Math.round(mindOf(id)+v),0,100)}
const moodMul=id=>.75+.3*mindOf(id)/100; // tinh thần 0 → ×0.75, 100 → ×1.05
function idolTotal(id){const i=S.idols[id];return i.vo+i.da+i.vi+i.ch}
function av(id,size=52,sil=false){
  const r=BY[id], c=r.idx%3, w=Math.floor(r.idx/3);
  const pic=`<i style="background-image:url(assets/idols_${r.sheet}.jpg);background-position:${c*50}% ${w*50}%"></i>`;
  return `<div class="av r${r.rar}${sil?" sil":""}" style="--s:${size}px" title="${esc(r.name)}"><span class="ini">${esc(r.name[0])}</span>${pic}</div>`;
}
function stars(n){return n?`<span class="stars">${"★".repeat(n)}</span>`:""}
function trainCost(){return 2e5*(1+S.level*2)}
function train(id,k,silent){
  const i=S.idols[id]; if(!i) return false;
  if(isOff(id)){if(!silent)toast("🛌 "+BY[id].name+" đang tạm nghỉ đến tuần "+i.off);return false}
  if(i.stam<20){if(!silent)toast("😵 "+BY[id].name+" quá mệt, cần nghỉ");return false}
  if(i[k]>=capOf(id)){if(!silent)toast("Đã chạm giới hạn. Gacha trùng để tăng ★");return false}
  if(S.money<trainCost()){if(!silent)toast("Không đủ tiền");return false}
  S.money-=trainCost(); i.stam-=20;
  const g=Math.max(1,ri(2,5)+S.equip-(mindOf(id)<30?2:0)); i[k]=Math.min(capOf(id),i[k]+g); addMind(id,-1); S.st.trains++; S.trainWeek=S.week;
  if(!silent) toast(`${STATS.find(s=>s[0]===k)[3]} ${BY[id].name} +${g} ${STATS.find(s=>s[0]===k)[1]}`);
  return true;
}
function trainAll(){
  const done=[]; own().forEach(id=>{const i=S.idols[id];const k=STATS.map(s=>s[0]).filter(k=>i[k]<capOf(id)).sort((a,b)=>i[a]-i[b])[0]; const b=k&&i[k]; if(k&&train(id,k,true))done.push([id,k,i[k]-b])});
  if(!done.length) return toast("Không ai luyện được (mệt / hết tiền / max)");
  scene({ids:done.slice(0,7).map(x=>x[0]),act:"practice",title:ic("train")+" Luyện tập",sub:done.length+" idol",
    res:done.map(([id,k,v])=>`${STATS.find(s=>s[0]===k)[3]} ${esc(BY[id].name)} <b>+${v}</b>`).join(" · ")});
  render();
}

/* ================== NHÓM ================== */
const active=g=>g.members.filter(id=>!isOff(id));
function power(g){
  const m=active(g).length?active(g):g.members, avg=m.reduce((a,id)=>a+idolTotal(id),0)/m.length, st=m.reduce((a,id)=>a+S.idols[id].stars,0)/m.length;
  const md=m.reduce((a,id)=>a+moodMul(id),0)/m.length;
  return Math.round(avg*(1+.06*(m.length-1))*(1+.05*st)*md);
}
const fanMul=g=>1+Math.log10(1+g.fans)/6;
const mktMul=()=>1+S.mkt*.12;
function canAct(g,a){
  if(g.acted===S.week) return "Nhóm đã hoạt động tuần này";
  if(!active(g).length) return "Mọi thành viên đang tạm nghỉ";
  const A=ACTS[a]; if(active(g).some(id=>S.idols[id].stam<A.st)) return "Thành viên quá mệt";
  if(a==="single"&&S.week-(g.lastSingle||-99)<MV_COOLDOWN) return "Chờ "+(MV_COOLDOWN-(S.week-g.lastSingle))+" tuần để ra bài mới";
  if(a==="single"&&S.money<singleCost()) return "Cần "+money(singleCost());
  if(a==="show"&&!g.songs.length) return "Cần phát hành bài hát trước";
  if(a==="concert"&&g.fans<1e4) return "Cần 10K fan";
  if(a==="concert"&&S.money<concertCost()) return "Cần "+money(concertCost());
  if(a==="tour"&&(S.level<2||g.fans<3e5)) return "Cần Toà nhà riêng + 300K fan";
  if(a==="tour"&&S.money<2e8) return "Cần "+money(2e8);
  if(a==="fanmeet"&&g.fans<300) return "Cần 300 fan";
  if(a==="fanmeet"&&S.money<fmCost()) return "Cần "+money(fmCost());
  return "";
}
const singleCost=()=>3e6*(1+S.level*3);
const concertCost=()=>2e7*(1+S.level);
const fmCost=()=>1e6*(1+S.level*2);
function act(gid,a){
  const g=S.groups.find(x=>x.id===gid); const why=canAct(g,a); if(why){toast(why);return}
  if(a==="show"){return openShow(g)}
  const A=ACTS[a]; g.acted=S.week;
  g.last=a;
  if(a==="rest"){g.members.forEach(id=>{S.idols[id].stam=Math.min(100,S.idols[id].stam+40);addMind(id,15)});
    scene({ids:active(g),act:"rest",title:ic("rest")+" "+esc(g.name)+" nghỉ ngơi",res:`Cả nhóm ngủ một giấc thật đã: +40 thể lực · +15 tinh thần ${ic("mind")}`,hue:(g.id*67+320)%360});return render()}
  active(g).forEach(id=>{S.idols[id].stam-=A.st;addMind(id,-A.mind)});
  const p=power(g), R={g,kind:a,song:g.songs[0]?g.songs[0].name:pick(["Sunny Lane (cover)","Paper Heart (cover)","Lemon Soda (cover)","Midnight Bus (cover)","First Snow (cover)"])};
  if(a==="busk"){const f=Math.round(p*rnd(.5,1)*mktMul()*fanMul(g)), m=Math.round(p*rnd(3e3,6e3)*(1+S.level));g.fans+=f;S.money+=m;S.st.busk++;
    R.title=ic("busk")+" Hát đường phố";R.res=`+${fans(f)} fan · +${money(m)} tiền tip`;R.q=qual(g,1);
    news(`${esc(g.name)} hát đường phố: +${fans(f)} fan, +${money(m)}`)}
  if(a==="single"){S.money-=singleCost();const name=pick(W1)+" "+pick(W2), q=Math.round(p*rnd(.8,1.25));
    const song={name,q,age:0}; song.rank=chartRank(g,q); g.songs.unshift(song); g.songs.length=Math.min(g.songs.length,6); g.lastSingle=S.week;
    const f=Math.round((q*4+g.fans*.05)*mktMul()); g.fans+=f; S.st.singles++; S.st.bestRank=Math.min(S.st.bestRank,song.rank);
    R.song=name;R.title=ic("mvcam")+` MV “${esc(name)}”`;R.big="#"+song.rank;R.res=`trên BXH Melody tuần này · +${fans(f)} fan`;
    R.views=Math.round((g.fans*rnd(3,6)+q*800)*(1+(100-song.rank)/40));R.res+=` · ${fans(R.views)} lượt xem MV`;
    R.q=clamp(1-song.rank/110+rnd(-.08,.08),.05,.97); if(song.rank<=10){active(g).forEach(id=>addMind(id,5));R.conf=song.rank===1?120:50}
    news(`💿 ${esc(g.name)} ra mắt MV “${name}” – hạng #${song.rank}, +${fans(f)} fan`)}
  if(a==="fanmeet"){S.money-=fmCost();const f=Math.round((g.fans*.02+150)*mktMul());g.fans+=f;active(g).forEach(id=>addMind(id,12));
    R.title=ic("fanmeet")+" Fan meeting";R.res=`+${fans(f)} fan · cả nhóm +12 tinh thần ${ic("mind")}`;R.q=clamp(.82+rnd(-.1,.1),.05,.97);
    news(`💞 ${esc(g.name)} tổ chức fan meeting: +${fans(f)} fan`)}
  if(a==="concert"){S.money-=concertCost();const at=Math.round(Math.min(g.fans*.25,lv().cap)*rnd(.8,1)), rev=at*3e4, f=Math.round(at*.5*mktMul());
    S.money+=rev;g.fans+=f;S.st.concerts++;R.title=ic("concert")+" Concert";R.big=fans(at)+" khán giả";R.res=`Doanh thu +${money(rev)} · +${fans(f)} fan`;R.q=clamp(qual(g,1.1)+.1,.05,.97);R.conf=80;
    news(`🎆 Concert ${esc(g.name)}: ${fans(at)} khán giả, doanh thu ${money(rev)}`)}
  if(a==="tour"){S.money-=2e8;const cities=ri(6,12), at=Math.round(Math.min(g.fans*.06,lv().tour||4e4)*cities), rev=at*5e4, f=Math.round(g.fans*.12);
    S.money+=rev;g.fans+=f;S.st.tours++;R.title=ic("tour")+" World Tour";R.big=cities+" thành phố";R.res=`${fans(at)} khán giả · doanh thu +${money(rev)} · +${fans(f)} fan quốc tế`;R.q=clamp(qual(g,1.1)+.15,.05,.97);R.conf=120;
    news(`✈️ World Tour ${esc(g.name)}: ${cities} thành phố, ${money(rev)}`)}
  R.react=reactions(g,a,R.q,R.song);
  perform(R,()=>showResult(R));
  render();
}
// chất lượng màn trình diễn 0..1 so với mặt bằng chung của tuần hiện tại
const expectPow=()=>100*(1+S.week/25)*(1+S.level*.35);
function qual(g,mul){return clamp(.5+(power(g)*mul/expectPow()-1)*.9+rnd(-.12,.12),.05,.97)}
function chartRank(g,q){const sc=q*Math.sqrt(1+g.fans/800);return clamp(Math.round(100*Math.exp(-sc/320)),1,100)}
function songIncome(g,s){return s.q*2e4*Math.sqrt(1+g.fans/5e3)*Math.pow(.85,s.age)}
function weeklySongIncome(){return S.groups.reduce((a,g)=>a+g.songs.reduce((b,s)=>b+(s.age<12?songIncome(g,s):0),0),0)}
function debut(){
  const m=ui.pick.filter(id=>S.idols[id]&&!S.idols[id].group);
  if(m.length<2) return toast("Cần ít nhất 2 thành viên");
  if(m.length>MAX_MEMBERS) return toast("Tối đa "+MAX_MEMBERS+" thành viên");
  if(S.groups.length>=lv().groups) return toast("Nâng cấp công ty để debut thêm nhóm");
  const cost=2e6*(1+S.level*3); if(S.money<cost) return toast("Cần "+money(cost)+" cho showcase debut");
  const name=(ui.gname||"").trim()||pick(G1)+" "+pick(G2);
  S.money-=cost; const g={id:S.gid++,name,members:m,fans:200,trophies:0,songs:[],debut:S.week,acted:0};
  m.forEach(id=>S.idols[id].group=g.id); S.groups.push(g); S.st.debuts++; ui.pick=[]; ui.gname="";
  news(`🎉 ${esc(name)} chính thức debut!`);
  const R={g,kind:"debut",song:"Debut Showcase",title:"🎉 DEBUT!",big:esc(name),res:"Showcase thành công · 200 fan đầu tiên",q:clamp(qual(g,1)+.1,.05,.97),conf:90,ok:"Bắt đầu hoạt động"};
  R.react=reactions(g,"debut",R.q,R.song); perform(R,()=>showResult(R)); render();
}
function disband(gid){
  const g=S.groups.find(x=>x.id===gid); g.members.forEach(id=>S.idols[id].group=null);
  S.groups=S.groups.filter(x=>x.id!==gid); news(`💔 ${esc(g.name)} tan rã`); closeModal(); render();
}

/* ================== SHOW ÂM NHẠC (mini-game) ================== */
let mg=null;
function openShow(g){
  const zw=22, zl=rnd(8,70), song=g.songs[0].name;
  mg={g,zl,zw,pos:0,dir:1,speed:rnd(.9,1.2),hits:[],raf:0};
  modal(`<div class="stack"><div class="stagebox" style="background-image:linear-gradient(rgba(43,24,64,.45),rgba(43,24,64,.8)),url(assets/bg_stage.jpg);--beat:${(60/124).toFixed(3)}s">
    <h2 class="center">${ic("show")} ${esc(g.name)} · “${esc(song)}”</h2>
    <div class="troupe inline">${troupe(g,38)}</div>
    <div class="center muted" style="color:#ffd1e6">Bấm khi vạch trắng vào ô vàng · 3 lượt</div>
    <div class="track"><div class="zone" style="left:${zl}%;width:${zw}%"><i></i></div><div class="marker" id="mk"></div></div>
    <div class="hits" id="hits"></div></div>
    <div class="row"><button class="btn ghost sm" data-a="snd" aria-label="Bật/tắt nhạc">${ic(Music.on?"sound":"mute")}</button><button class="btn sp" data-a="mgHit" style="font-size:20px;padding:14px">BẤM! ${ic("note")}</button><button class="btn ghost sm" data-a="mgAuto">Tự diễn</button></div></div>`,true);
  Music.play(g.name+song,"pop",8,124);
  const step=()=>{if(!mg)return;mg.pos+=mg.dir*mg.speed*(1+mg.hits.length*.35);if(mg.pos>100){mg.pos=100;mg.dir=-1}if(mg.pos<0){mg.pos=0;mg.dir=1}
    const el=document.getElementById("mk");if(el)el.style.left=mg.pos+"%";mg.raf=requestAnimationFrame(step)};
  mg.raf=requestAnimationFrame(step);
}
function mgHit(){
  if(!mg||mg.hits.length>=3)return; const c=mg.zl+mg.zw/2, d=Math.abs(mg.pos-c);
  const h=d<=mg.zw*.08?["PERFECT",1.35,"#ffd75a"]:d<=mg.zw/2?["GREAT",1.15,"#7fe0c4"]:["MISS",.85,"#ff9db0"];
  mg.hits.push(h[1]); document.getElementById("hits").insertAdjacentHTML("beforeend",`<span style="color:${h[2]}">${h[0]}</span>`);
  if(mg.hits.length===3) setTimeout(()=>finishShow(mg.hits.reduce((a,b)=>a+b,0)/3),450);
}
function finishShow(mul){
  const g=mg.g; cancelAnimationFrame(mg.raf); mg=null; Music.stop(true); g.last="show";
  g.acted=S.week; active(g).forEach(id=>{S.idols[id].stam-=ACTS.show.st;addMind(id,-ACTS.show.mind)});
  const me=Math.round(power(g)*mul*fanMul(g)), rival=Math.round(100*(1+S.week/25)*rnd(.85,1.2)*(1+S.level*.35));
  const win=me>=rival; let f,m;
  if(win){f=Math.round((300+g.fans*.06)*mktMul());m=1e6*(1+S.level*2);g.trophies++;S.st.wins++;g.fans+=f;S.money+=m;active(g).forEach(id=>addMind(id,8));news(`🏆 ${esc(g.name)} giành #1 show âm nhạc! (cúp thứ ${g.trophies})`)}
  else{f=Math.round((80+g.fans*.015)*mktMul());g.fans+=f;news(`📺 ${esc(g.name)} về nhì ở show âm nhạc`)}
  const R={g,kind:"show",song:g.songs[0].name,title:win?ic("trophy")+" #1 WIN!":"🥈 Hạng 2",conf:win?110:0,ok:"OK",
    q:clamp((win?.62:.32)+(mul-1)*.8+rnd(-.08,.08),.05,.97),
    res:`<div class="row" style="justify-content:center;gap:18px"><div><div class="muted">${esc(g.name)}</div><div class="big num" style="color:var(--pink)">${me}</div></div><div class="big">vs</div><div><div class="muted">Đối thủ</div><div class="big num">${rival}</div></div></div>
    ${win?`+${fans(f)} fan · +${money(m)} · +1 cúp · cả nhóm +8 tinh thần`:`+${fans(f)} fan. Luyện thêm rồi thử lại nhé!`}`};
  R.react=reactions(g,"show",R.q,R.song);
  showResult(R);
}

/* ================== CỘNG ĐỒNG MẠNG ================== */
// Sinh 5–7 bình luận sau mỗi lần xuất hiện trước công chúng, áp hiệu ứng lên tinh thần idol
function reactions(g,kind,q,song){
  const ms=active(g).length?active(g):g.members, L=Math.log10(10+g.fans);
  const by=(k,dir)=>[...ms].sort((a,b)=>dir*(S.idols[b][k]-S.idols[a][k]))[0];
  const fill=(t,n)=>t.replace(/\{n\}/g,BY[n]?BY[n].name:"").replace(/\{g\}/g,g.name).replace(/\{s\}/g,song||"bài mới");
  const user=n=>pick([...USERS,"user"+ri(1000,9999),BY[n].name.toLowerCase().replace(/[^a-z]/g,"")+"_stan",g.name.toLowerCase().replace(/\s+/g,"")+".forever"]);
  const hateP=clamp(.04+L*.03+(1-q)*.22,.03,.42), out=[], sad=ms.filter(id=>mindOf(id)<40);
  const mk=(t,n,txt)=>({t,n,txt,plat:pick(PLAT),user:user(n||pick(ms)),likes:Math.round(rnd(4,40)*L*L*(t==="pos"?1.6:t==="hate"?.7:1))});
  for(let k=0;k<5;k++){
    const x=Math.random(); let c;
    if(k===4&&sad.length&&Math.random()<.75){const n=pick(sad);c=mk("concern",n,fill(pick(TXT.concern),n))}
    else if(x<hateP){const n=pick(ms);c=mk("hate",n,fill(pick(TXT.hate),n))}
    else if(x<hateP+q*.78){if(Math.random()<.5){const st=pick(["vo","da","vi","ch"]),n=by(st,1);c=mk("pos",n,fill(pick(TXT[st]),n))}else{const n=pick(ms);c=mk("pos",null,fill(pick(TXT[kind]||TXT.show),n))}}
    else if(x<hateP+q*.78+.14){c=mk("neu",null,fill(pick(TXT.neu),pick(ms)))}
    else if(Math.random()<.6){const st=pick(["vo","da","vi"]),n=by(st,-1);c=mk("neg",n,fill(pick(TXT["n"+st]),n))}
    else c=mk("neg",null,fill(pick(TXT.flop),pick(ms)));
    out.push(c);
    if(c.t==="hate"&&Math.random()<.3+L*.06) out.push(mk("def",c.n,fill(pick(TXT.def),c.n)));
  }
  const shield=1-S.care*.06; // phòng chăm sóc tinh thần giảm sát thương bình luận ác ý
  out.forEach(c=>{if(!c.n||!S.idols[c.n])return;
    if(c.t==="hate"){c.fx=-Math.max(1,Math.round(rnd(5,10)*shield))}
    else if(c.t==="neg"){c.fx=-Math.max(1,Math.round(rnd(1,3)*shield))}
    else if(c.t==="pos"||c.t==="def"){c.fx=ri(1,3)}
    if(c.fx)addMind(c.n,c.fx)});
  out.reduce((a,b)=>b.likes>a.likes?b:a).top=1;
  const good=out.filter(c=>c.t==="pos"||c.t==="def").length, bad=out.filter(c=>c.t==="neg"||c.t==="hate").length;
  const pos=Math.round(100*(good+.5*(out.length-good-bad))/out.length);
  let fb=Math.round((g.fans*.012+40)*(pos-50)/50); if(fb<0)fb=-Math.min(-fb,Math.round(g.fans*.02));
  g.fans=Math.max(0,g.fans+fb);
  const notes=[fb>=0?`Lan truyền tích cực: +${fans(fb)} fan`:`Phản ứng tiêu cực: −${fans(-fb)} fan`];
  if(pos>=70){ms.forEach(id=>addMind(id,3));notes.push("cả nhóm vui vẻ +3 tinh thần")}
  if(out.some(c=>c.t==="hate")) notes.push("bình luận ác ý làm idol tổn thương, hãy chăm sóc tinh thần ở tab Idol");
  S.feed.unshift(...out.filter(c=>c.t!=="def").slice(0,3).map(c=>({t:c.t,txt:c.txt,plat:c.plat,user:c.user,likes:c.likes,g:g.name,w:S.week})));
  S.feed.length=Math.min(S.feed.length,24);
  return {list:out,pos,note:notes.join(" · ")};
}
function cmtHtml(c,i=0,full=true){
  const fx=c.fx?(c.fx>0?`<span class="fx" style="color:var(--mint)">+${c.fx} ${ic("mind")}</span>`:`<span class="fx" style="color:var(--red)">${c.fx} ${ic("mind")} ${esc(BY[c.n].name)}</span>`):"";
  return `<div class="cmt ${c.t}${c.top?" top":""}" style="animation-delay:${i*.22}s"><div class="who"><span class="plat" style="background:${c.plat[1]}">${c.plat[0]}</span>${esc(c.user)}${c.top?' · <b style="color:#d18e12">🔥 top</b>':""}${full?fx:` · ${esc(c.g)} · T${c.w}`}</div>
    <div>${c.t==="def"?"↳ ":""}${esc(c.txt)}</div><div class="lk">${ic("thumbs")} ${c.likes.toLocaleString("vi-VN")}</div></div>`;
}
function netBox(rc){
  const col=rc.pos>=60?"var(--mint)":rc.pos>=40?"#d18e12":"var(--red)";
  return `<div class="netbox"><div class="row"><b class="sp">${ic("comment")} Cộng đồng mạng nói gì?</b><b style="color:${col}">${rc.pos}% tích cực</b></div>
    <div class="senti"><span style="width:${rc.pos}%"></span></div>
    <div class="cmts">${rc.list.map((c,i)=>cmtHtml(c,i)).join("")}</div>
    <div class="muted">${rc.note}</div></div>`;
}
function showResult(R){
  const g=R.g, ms=g.members.filter(id=>S.idols[id]);
  modal(`<div class="stack center"><div class="big" style="font-size:24px">${R.title}</div>
    ${R.big?`<div class="big" style="color:var(--pink)">${R.big}</div>`:""}
    <div class="row" style="justify-content:center;gap:6px;flex-wrap:wrap">${ms.map(id=>{const v=mindOf(id);return `<div class="dex">${av(id,44)}<span>${moodOf(v)[0]} ${v}</span></div>`}).join("")}</div>
    <div>${R.res}</div>${netBox(R.react)}
    <button class="btn" data-a="close">${R.ok||"Tuyệt!"}</button></div>`);
  if(R.conf)confetti(R.conf); render();
}

/* ================== NHẠC (WebAudio, tự sinh theo tên bài) ================== */
const Music=(()=>{
  let ctx=null, bus=null, on=true, nbuf=null;
  try{on=localStorage.getItem("kpopceo_snd")!=="0"}catch(e){}
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function seeded(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
    return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
  function ensure(){if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;ctx=new AC()}if(ctx.state==="suspended")ctx.resume();return ctx}
  function noise(){if(nbuf)return nbuf;nbuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return nbuf}
  function env(g,t,a,peak,dec){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)}
  function tone(type,f,t,dur,vol,cut,det=0){const o=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();o.type=type;o.frequency.value=f;o.detune.value=det;lp.type="lowpass";lp.frequency.value=cut;env(g,t,.006,vol,dur);o.connect(lp);lp.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.05)}
  function kick(t,v=.9){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);env(g,t,.002,v,.26);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.32)}
  function nz(t,dur,vol,type,f,q=1){const s=ctx.createBufferSource(),bf=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise();bf.type=type;bf.frequency.value=f;bf.Q.value=q;env(g,t,.002,vol,dur);s.connect(bf);bf.connect(g);g.connect(bus);s.start(t,Math.random()*.5);s.stop(t+dur+.05)}
  function cheer(t,dur,vol){const s=ctx.createBufferSource(),bf=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise();s.loop=true;bf.type="bandpass";bf.frequency.value=1100;bf.Q.value=.6;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.5);g.gain.setValueAtTime(vol,t+dur-.8);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(bf);bf.connect(g);g.connect(bus);s.start(t);s.stop(t+dur+.1)}
  // style: pop | busk | soft | big ; trả về độ dài (giây)
  function play(seed,style,bars,bpm){
    stop(); if(!on)return 0; const c=ensure(); if(!c)return 0;
    bus=c.createGain(); const comp=c.createDynamicsCompressor(); bus.gain.value=.3; bus.connect(comp); comp.connect(c.destination);
    const R=seeded(seed), b=60/bpm, t0=c.currentTime+.1, key=50+Math.floor(R()*6);
    const PROG=[[0,7,9,5],[9,5,0,7],[5,7,9,9],[0,9,5,7],[9,7,5,4],[2,7,0,9]][Math.floor(R()*6)];
    const Q={0:[0,4,7,11],7:[0,4,7,10],9:[0,3,7,10],5:[0,4,7,11],2:[0,3,7,10],4:[0,3,7,10]};
    const PENT=[0,2,4,7,9,12,14,16], motif=Array.from({length:8},(_,i)=>i&&R()<.28?null:PENT[Math.floor(R()*PENT.length)]);
    const soft=style==="busk"||style==="soft";
    for(let bar=0;bar<bars;bar++){
      const root=PROG[bar%4], ch=Q[root], tb=t0+bar*4*b, hot=bar>=Math.min(2,bars-2);
      for(let q=0;q<4;q++){const t=tb+q*b;
        if(soft){ if(q%2===0)kick(t,.45); nz(t+b/2,.05,.06,"highpass",7000); if(q%2)nz(t,.12,.12,"bandpass",2500,2) }
        else{ kick(t); if(q%2)nz(t,.2,.32,"bandpass",1700,.8); nz(t+b/2,.04,.1,"highpass",8000); if(hot)nz(t+b*.75,.03,.06,"highpass",9500) }
        const bn=key-12+root; tone(soft?"triangle":"sawtooth",mtof(bn),t,b*.5,soft?.25:.2,soft?500:700); if(!soft)tone("sawtooth",mtof(bn+(q%2?12:0)),t+b/2,b*.4,.14,700);
      }
      if(soft){ for(let e=0;e<8;e++){const n=key+12+root+ch[[0,1,2,3,2,1,2,1][e]]+(e===4?12:0);tone("triangle",mtof(n),tb+e*b/2,b*1.2,.09,3200)} }
      else{ ch.forEach(iv=>tone("sawtooth",mtof(key+12+root+iv),tb,4*b,.022,1400,ri(-8,8)));
        for(let q=0;q<4;q++) ch.slice(0,3).forEach(iv=>tone("square",mtof(key+12+root+iv),tb+q*b+b/2,b*.22,.035,2400)) }
      if(hot){ for(let e=0;e<8;e++){const m=motif[(e+(bar%2?3:0))%8]; if(m==null)continue;
        tone(soft?"triangle":"square",mtof(key+24+m),tb+e*b/2,b*.42,soft?.11:.075,soft?3500:2800); if(!soft)tone("triangle",mtof(key+36+m),tb+e*b/2,b*.3,.03,5000)} }
    }
    const tEnd=t0+bars*4*b; kick(tEnd); nz(tEnd,1.8,.22,"highpass",5000); Q[PROG[0]].forEach(iv=>tone("sawtooth",mtof(key+12+PROG[0]+iv),tEnd,1.6,.04,1600));
    if(style==="big")cheer(t0,bars*4*b+2,.05); if(style==="big"||style==="pop")cheer(tEnd-.2,2.6,.16);
    return bars*4*b;
  }
  function stop(fade){if(!bus)return;const g=bus,c=ctx;bus=null;try{g.gain.cancelScheduledValues(c.currentTime);g.gain.setValueAtTime(g.gain.value,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+(fade?.6:.15))}catch(e){}setTimeout(()=>{try{g.disconnect()}catch(e){}},800)}
  function toggle(){on=!on;try{localStorage.setItem("kpopceo_snd",on?"1":"0")}catch(e){}if(!on)stop();return on}
  return {play,stop,toggle,unlock:()=>{if(on)ensure()},get on(){return on}};
})();

/* ================== SÂN KHẤU BIỂU DIỄN (animation) ================== */
const troupe=(g,size)=>troupeIds(active(g).length?active(g):g.members,size,(g.id*67+320)%360);
function troupeIds(ids,size,hue=330){
  const ms=ids.filter(id=>S.idols[id]);
  const ctr=[...ms].sort((a,b)=>(S.idols[b].ch+S.idols[b].vi)-(S.idols[a].ch+S.idols[a].vi))[0];
  const rest=ms.filter(x=>x!==ctr), order=[]; rest.forEach((id,i)=>i%2?order.push(id):order.unshift(id)); order.splice(Math.floor(order.length/2)+(rest.length%2?1:0),0,ctr);
  let s=size||(ms.length<=3?60:ms.length<=5?50:42); const many=ms.length>7; if(many) s=Math.min(s,40); // nhóm đông (>7): xếp 2 hàng so le, chỉ hiện tên center
  const one=(id,i)=>`<div class="dancer${id===ctr?" c":""}" style="--s:${id===ctr?Math.round(s*1.12):s}px;--oc:hsl(${(hue+(i%2)*38)%360} 85% ${id===ctr?62:72}%)">${av(id,id===ctr?Math.round(s*1.12):s)}<div class="body"><span class="arm l"></span><span class="arm r"></span></div><div class="legs"><i></i><i></i></div><span class="nm"${many&&id!==ctr?" hidden":""}>${esc(BY[id].name)}</span></div>`;
  if(!many) return order.map(one).join("");
  const c=order.indexOf(ctr), row=f=>order.map((id,i)=>[id,i]).filter(([,i])=>((i-c)%2===0)===f).map(([id,i])=>one(id,i)).join("");
  return `<div class="trows"><div class="trow back">${row(false)}</div><div class="trow front">${row(true)}</div></div>`;
}
let PF=null;
function perform(R,done){
  const g=R.g, k=R.kind, mv=k==="single";
  const cfg={busk:["busk",96,4,"bg_street"],fanmeet:["soft",104,4,"bg_studio"],offfan:["soft",100,4,"bg_street"],single:["pop",118,6,"bg_mv"],debut:["pop",122,6,"bg_stage"],concert:["big",128,6,"bg_stage"],tour:["big",128,6,"bg_stage"]}[k]||["pop",124,6,"bg_stage"];
  const [style,bpm,bars,bg]=cfg, beat=60/bpm, dur=bars*4*beat;
  const sub={busk:"Hongdae · biểu diễn đường phố",fanmeet:"Fan meeting thân mật",offfan:"Off fan · gặp gỡ fan offline",single:"Quay MV",debut:"Debut showcase",concert:"Concert · "+fans(Math.min(g.fans*.25,lv().cap))+" khán giả",tour:"World Tour"}[k]||"";
  const LC=g.ls?[g.ls,g.ls,"#ffffff"]:["#ff9dd0","#c9b2ff","#8ff0d0","#ffe08a","#9fd0ff"];
  const crowd=k==="busk"?10:k==="fanmeet"?14:22;
  modal(`<div class="stack"><div class="perf${mv?" mv":""}" id="perf" data-m="0" style="--beat:${beat.toFixed(3)}s">
    <div class="bgl" style="background-image:url(assets/${bg}.jpg)"></div><div class="beam b1"></div><div class="beam b2"></div><div class="beam b3"></div><div class="flash"></div><div class="dim"></div>
    <div class="hud"><div><b>${esc(g.name)}</b><small>${ic("note")} ${esc(R.song)}</small><small>${sub}</small></div>${mv?`<div class="rec"><i></i>REC · ${ic("views")} <span id="pfViews">0</span></div>`:""}</div>
    <div class="troupe">${troupe(g)}</div>
    <div class="crowd">${Array.from({length:crowd},(_,i)=>`<i style="--lc:${LC[(i+g.id)%LC.length]}"></i>`).join("")}</div>
    <div class="prog" id="pfProg"></div></div>
    <div class="row"><button class="btn ghost sm" data-a="snd" aria-label="Bật/tắt nhạc">${ic(Music.on?"sound":"mute")}</button><span class="sp muted center">Đang biểu diễn…</span><button class="btn sm" data-a="pfSkip">${ic("skip")} Bỏ qua</button></div></div>`,true);
  Music.play(g.name+R.song,style,bars,bpm);
  const el=document.getElementById("perf"), prog=document.getElementById("pfProg"), names=g.members.filter(id=>S.idols[id]).map(id=>BY[id].name.toUpperCase());
  requestAnimationFrame(()=>{prog.style.transition=`width ${dur}s linear`;prog.style.width="100%"});
  const t0=performance.now(), timers=[];
  timers.push(setInterval(()=>{if(!PF)return;const bar=Math.floor((performance.now()-t0)/1000/beat/4);
    el.dataset.m=bar<1?0:String((bar>>0)%4); el.classList.toggle("hot",bar>=Math.min(2,bars-2));
    if(mv){const v=document.getElementById("pfViews");if(v)v.textContent=fans(R.views*Math.min(1,(performance.now()-t0)/1000/dur))}},beat*1000));
  timers.push(setInterval(()=>{if(!PF)return;const f=document.createElement("div");f.className="floaty";
    const r=Math.random(); f.innerHTML=r<.3?ic(pick(["fans","note","star","lightstick"])):r<.6?pick(names)+"!!":pick(["Hwaiting!","사랑해요!","Encore!","♡♡♡","Daebak!","Đỉnh quá!"]);
    f.style.left=rnd(6,80)+"%"; f.style.bottom=rnd(14,30)+"%"; f.style.color=pick(LC); el.appendChild(f); setTimeout(()=>f.remove(),2500)},beat*1000*(k==="busk"?2:1)));
  PF={done,timers,to:setTimeout(endPerform,dur*1000+500)};
}
// [nền, kiểu chuyển động, nhạc, bpm, chữ/icon bay lên, địa điểm]
const SCN={
  practice:["bg_room","dance","pop",120,["💦","5, 6, 7, 8!","s_practice","Hwaiting!"],"Phòng tập"],
  record:["bg_studio","sway","soft",90,["note","♪","s_record","♫"],"Phòng thu âm"],
  rest:["bg_hq","sleep","soft",68,["Zz","💤","s_rest","zzZ"],"Ký túc xá"],
  photo:["bg_mv","pose","pop",100,["s_photo","✨","Click!","📸"],"Studio chụp tạp chí"],
  variety:["bg_studio","laugh","pop",112,["ㅋㅋㅋ","😂","s_variety","LOL"],"Trường quay show giải trí"],
  live:["bg_room","wave","soft",96,["♡","comment","❤️","thumbs"],"FanTalk LIVE"],
  fansign:["bg_hq","wave","soft",96,["s_fansign","♡","fanmeet","s_gifts"],"Buổi fansign"],
  bday:["bg_mv","laugh","soft",104,["🎂","HBD!","s_bday","s_gifts","🎉"],"Tiệc sinh nhật"],
  abroad:["bg_street","wave","pop",116,["Hello!","views","Welcome!","♡"],"Lịch trình nước ngoài"],
  chat:["bg_hq","sway","soft",80,["chat","♡","💬"],"Phòng CEO"],
  letter:["bg_hq","sway","soft",80,["letter","♡","🥹"],"Đọc thư fan"],
  bbq:["bg_street","laugh","soft",100,["bbq","🥩","Ngon quá!","♡"],"Quán thịt nướng"],
  therapy:["bg_hq","sway","soft",76,["therapy","mind","♡"],"Phòng tư vấn tâm lý"],
  trip:["bg_street","wave","soft",96,["vacation","🌴","☀️","🌊"],"Đảo Jeju"],
};
const TABLE={fansign:["s_gifts","s_fansign","s_gifts"],chat:["chat","s_sticker"],letter:["letter","s_gifts","letter"],bbq:["bbq","bbq"],therapy:["therapy","mind"],record:["s_record","note"]};
const tok=x=>/^[a-z_]+$/.test(x)?ic(x):esc(x);
// cảnh animation cho mọi hoạt động: o={ids,act,title,sub,res,hue}
function scene(o){
  const [bg,mode,style,bpm,fl,place]=SCN[o.act]||SCN.practice, beat=60/bpm, dur=Math.min(6.5,8*beat), ids=o.ids.filter(id=>S.idols[id]), live=o.act==="live";
  modal(`<div class="stack"><div class="perf scene${TABLE[o.act]?" tbl":""}" id="perf" data-act="${mode}" data-m="0" style="--beat:${beat.toFixed(3)}s">
    <div class="bgl" style="background-image:url(assets/${bg}.jpg)"></div><div class="flash"></div><div class="dim"></div>
    <div class="hud"><div><b>${o.title}</b><small>${place}${o.sub?" · "+o.sub:""}</small></div>${live?`<div class="rec"><i></i>LIVE · ${ic("views")} <span id="pfViews">0</span></div>`:""}</div>
    ${o.act==="abroad"?`<div class="plane">${ic("s_abroad")}</div>`:""}
    ${mode==="sleep"?'<div class="bed"></div>':""}<div class="troupe">${troupeIds(ids,ids.length>4?44:56,o.hue)}</div>${TABLE[o.act]?`<div class="table">${TABLE[o.act].map(x=>ic(x)).join("")}</div>`:""}
    <div class="prog" id="pfProg"></div></div>
    <div id="scRes" class="row"><button class="btn ghost sm" data-a="snd" aria-label="Bật/tắt nhạc">${ic(Music.on?"sound":"mute")}</button><span class="sp muted center">Đang diễn ra…</span><button class="btn sm" data-a="pfSkip">${ic("skip")} Kết quả</button></div></div>`);
  Music.play(o.act+ids.join(""),style,2,bpm);
  const el=document.getElementById("perf"), prog=document.getElementById("pfProg"), t0=performance.now(), viewers=ri(800,3000)*(1+S.level), timers=[];
  requestAnimationFrame(()=>{prog.style.transition=`width ${dur}s linear`;prog.style.width="100%"});
  timers.push(setInterval(()=>{if(!PF)return;const f=document.createElement("div");f.className="floaty";f.innerHTML=tok(pick(fl));
    f.style.left=rnd(6,80)+"%";f.style.bottom=rnd(25,45)+"%";f.style.color=pick(["#ffd1e6","#e7dcff","#fff3c4","#d3f7ea"]);el.appendChild(f);setTimeout(()=>f.remove(),2500);
    if(mode==="dance")el.dataset.m=String(Math.floor((performance.now()-t0)/1000/beat/2)%4);
    if(live){const v=document.getElementById("pfViews");if(v)v.textContent=fans(viewers*Math.min(1,(performance.now()-t0)/1000/dur))}},beat*1000));
  PF={timers,to:setTimeout(endPerform,dur*1000+300),done:()=>{const r=document.getElementById("scRes");
    if(r)r.outerHTML=`<div class="stack center"><div class="hint">${o.res||""}</div><button class="btn" data-a="close">${o.ok||"OK"}</button></div>`;if(o.after)o.after()}};
}
// sân khấu mini trên thẻ nhóm: cho thấy nhóm đang làm gì
const MINI={busk:["bg_street","dance","Vừa hát đường phố ở Hongdae"],single:["bg_mv","dance","Đang quảng bá MV mới"],show:["bg_stage","dance","Vừa diễn show âm nhạc"],fanmeet:["bg_studio","wave","Vừa gặp gỡ fan"],
  concert:["bg_stage","dance","Concert vừa kết thúc"],tour:["bg_stage","dance","Đang lưu diễn World Tour"],rest:["bg_hq","sleep","Đang ngủ bù ở ký túc xá"],idle:["bg_room","sway","Đang chờ chỉ thị của CEO"]};
function miniAct(g){const now=absDay(), st=S.sched.find(e=>e.day===now&&e.done&&e.who==="g:"+g.id);
  return st?st.k:g.acted===S.week&&g.last?g.last:"idle"}
function miniStage(g){
  const a=miniAct(g), m=MINI[a]||(SCN[a]&&[SCN[a][0],SCN[a][1],"Đang ở "+SCN[a][5].toLowerCase()])||MINI.idle;
  return `<div class="perf mini" data-act="${m[1]==="dance"?"dance":m[1]}" data-m="${a==="concert"||a==="tour"?1:0}" style="--beat:${m[1]==="sleep"?".9":".5"}s">
    <div class="bgl" style="background-image:url(assets/${m[0]}.jpg)"></div><div class="dim"></div>
    <div class="hud"><small>${m[2]}</small></div><div class="troupe">${troupe(g,30)}</div>
    <button class="btn sm replay" data-a="replay" data-g="${g.id}">▶ Xem</button></div>`;
}
function replay(gid){
  const g=S.groups.find(x=>x.id===gid); if(!g)return; const a=miniAct(g), song=g.songs[0]?g.songs[0].name:"Debut Showcase";
  if(ACTS[a]&&a!=="rest") return perform({g,kind:a,song,views:Math.round(g.fans*8)},()=>closeModal());
  scene({ids:active(g),act:a==="idle"?"practice":a,title:esc(g.name),res:a==="idle"?"Các thành viên tự luyện tập trong lúc chờ lịch trình 💪":"Hậu trường hôm nay của "+esc(g.name)+" 💕",hue:(g.id*67+320)%360});
}
function popAt(x,y,html){const d=document.createElement("div");d.className="popf";d.innerHTML=html;d.style.left=x+"px";d.style.top=y+"px";document.body.appendChild(d);setTimeout(()=>d.remove(),1500)}
function endPerform(){if(!PF)return;const d=PF.done;PF.timers.forEach(clearInterval);clearTimeout(PF.to);PF=null;Music.stop(true);d()}

/* ================== LỊCH TRÌNH (sticker) ================== */
const DAY_MS=WEEK_MS/7, DOW=["T2","T3","T4","T5","T6","T7","CN"];
const absDay=()=>(S.week-1)*7+clamp(Math.floor((Date.now()-S.weekStart)/DAY_MS),0,6);
// [icon, tên, đối tượng: m=thành viên · g=cả nhóm · b=cả hai, hiệu ứng]
const SCH={
  practice:["s_practice","Luyện tập","b","+2 chỉ số ngẫu nhiên · −10 thể lực"],
  record:["s_record","Thu âm","b","+2 Vocal · −8 thể lực"],
  rest:["s_rest","Ngày nghỉ","b","+20 thể lực · +8 tinh thần"],
  photo:["s_photo","Chụp tạp chí","m","+2 Visual · nhận tiền · −8 thể lực"],
  variety:["s_variety","Show giải trí","b","+2 Sức hút · thêm fan · −8 thể lực"],
  live:["s_live","Livestream","b","Thêm fan · +5 tinh thần"],
  fansign:["s_fansign","Fansign","g","Ký tặng: thêm fan · +6 tinh thần · −5 thể lực"],
  offfan:["s_offfan","Off fan","g","Gặp fan offline, có biểu diễn + bình luận · cần 500 fan"],
  lsale:["s_lsale","Mở bán lightstick","g","Bán lightstick chính thức → tiền + fan"],
  bday:["s_bday","Sinh nhật","m","Fan mừng sinh nhật: +15 tinh thần · thêm fan"],
  abroad:["s_abroad","Lịch nước ngoài","b","Fan quốc tế + tiền · −15 thể lực"],
};
const VIS={offfan:1,lsale:1};
const gCol=g=>g.ls||`hsl(${(g.id*67+320)%360} 80% 66%)`;
function schWho(w){if(!w)return null;if(w.startsWith("g:")){const g=S.groups.find(x=>x.id===+w.slice(2));return g?{g,name:g.name,ids:g.members}:null}return S.idols[w]?{id:w,name:BY[w].name,ids:[w]}:null}
const whoMini=(w,s=15)=>{const t=schWho(w);return !t?"":t.g?`<span class="gdot" style="--s:${s}px;--gc:${gCol(t.g)}">${esc(t.g.name[0])}</span>`:av(t.id,s)};
function dayLabel(day){const r=day-absDay();return r===0?"Hôm nay":r===1?"Ngày mai":DOW[day%7]+" · T"+((Math.floor(day/7))%52+1)}
function openCal(){
  const now=absDay(), w0=(S.week-1)*7, ks=Object.keys(SCH);
  if(!SCH[ui.stk]&&ui.stk!=="trash")ui.stk="practice";
  const targets=[...S.groups.map(g=>"g:"+g.id),...own().sort((a,b)=>(S.idols[a].group||99)-(S.idols[b].group||99))];
  if(!schWho(ui.who))ui.who=targets[0];
  const del=ui.stk==="trash", A=SCH[ui.stk]||["s_trash","Gỡ sticker","b","Bấm vào sticker chưa diễn ra để gỡ khỏi lịch"], t=schWho(ui.who);
  const bad=!t||del?"":A[2]==="m"&&t.g?"Sticker này dán cho từng thành viên":A[2]==="g"&&!t.g?"Sticker này dán cho cả nhóm":"";
  let cells="";
  for(let d=0;d<28;d++){const day=w0+d, ss=S.sched.filter(e=>e.day===day);
    if(d%7===0)cells+=`<div class="wkh">Tuần ${((Math.floor(day/7))%52)+1}${d?"":" · tuần này"}</div>`;
    cells+=`<button class="day${day===now?" today":""}${day<now?" past":""}" data-a="calDay" data-d="${day}" ${day<now?"disabled":""} aria-label="${DOW[d%7]}"><span class="dn">${day===now?"Hôm nay":DOW[d%7]}</span>
      ${ss.map(e=>`<span class="stk${e.done?" done":""}" style="--r:${(e.id*37%13)-6}deg" ${e.done||!del?"":`data-a="calDel" data-id="${e.id}"`} title="${esc(SCH[e.k][1]+" · "+(schWho(e.who)||{name:"?"}).name+(e.done?" (xong)":""))}">${ic(SCH[e.k][0])}${whoMini(e.who)}</span>`).join("")}</button>`}
  const html=`<div class="stack" style="gap:8px"><div class="calhead">${ic("s_cal","lg")}<div class="sp"><h3>Lịch trình</h3><div class="muted" style="font-size:12px">1 ngày ≈ ${Math.round(DAY_MS/1000)} giây · sticker tự chạy khi đến ngày</div></div><button class="btn ghost sm" data-a="close">Đóng</button></div>
    <b style="font-size:13px">1 · Chọn sticker</b>
    <div class="palette">${ks.map(k=>`<button class="${k===ui.stk?"on":""}" data-a="calStk" data-k="${k}">${ic(SCH[k][0])}${SCH[k][1]}</button>`).join("")}<button class="${del?"on":""}" data-a="calStk" data-k="trash">${ic("s_trash")}Gỡ sticker</button></div>
    <div class="hint" style="font-size:12px;padding:6px 10px">${ic(A[0])} <b>${A[1]}</b> · ${del?"":(A[2]==="m"?"cho thành viên":A[2]==="g"?"cho cả nhóm":"thành viên hoặc cả nhóm")+" · "}${A[3]}</div>
    <b style="font-size:13px">2 · Dán cho ai?</b>
    <div class="whos">${targets.map(w=>{const x=schWho(w);return `<button class="${w===ui.who?"on":""}" data-a="calWho" data-k="${w}">${whoMini(w,24)}${x.g?"Cả nhóm "+esc(x.name):esc(x.name)}</button>`}).join("")||`<span class="muted">Chưa có idol</span>`}</div>
    ${bad?`<div class="muted" style="color:var(--red);font-size:12px">⚠️ ${bad}</div>`:""}
    <b style="font-size:13px">3 · ${del?"Bấm vào sticker để gỡ":`Bấm vào ngày để dán (mỗi ngày tối đa ${STK_PER_DAY} sticker, ${STK_PER_WHO}/người)`}</b>
    <div class="cal">${cells}</div></div>`;
  const box=ui.calOpen&&document.querySelector("#modalRoot .box");
  if(box){const keep=[".palette",".whos"].map(q=>(box.querySelector(q)||{}).scrollLeft||0), top=box.scrollTop;
    box.innerHTML=html; [".palette",".whos"].forEach((q,i)=>{const e=box.querySelector(q);if(e)e.scrollLeft=keep[i]}); box.scrollTop=top}
  else modal(html);
  ui.calOpen=true;
}
function placeSch(day){
  const now=absDay(); if(day<now) return toast("Ngày này đã qua");
  if(ui.stk==="trash"){const e=S.sched.filter(x=>x.day===day&&!x.done).pop(); if(e){S.sched=S.sched.filter(x=>x!==e);render();openCal()} return}
  const k=ui.stk, A=SCH[k], t=schWho(ui.who); if(!t) return toast("Chọn idol hoặc nhóm trước");
  if(A[2]==="m"&&t.g) return toast(A[1]+" chỉ dán cho từng thành viên");
  if(A[2]==="g"&&!t.g) return toast(A[1]+" chỉ dán cho cả nhóm");
  const same=S.sched.filter(e=>e.day===day);
  if(same.length>=STK_PER_DAY) return toast("Ngày này kín lịch rồi (tối đa "+STK_PER_DAY+" sticker)");
  const mine=same.filter(e=>e.who===ui.who);
  if(mine.length>=STK_PER_WHO) return toast(esc(t.name)+" đã có "+STK_PER_WHO+" lịch ngày này");
  if(mine.some(e=>e.k===k)) return toast(esc(t.name)+" đã có "+A[1]+" ngày này rồi");
  if(k==="offfan"&&t.g.fans<500) return toast("Cần 500 fan để tổ chức off fan");
  if(k==="lsale"&&!t.g.ls) return toast("Nhóm chưa có lightstick. Thiết kế ở tab Nhóm trước nhé");
  if(k==="bday"&&S.sched.some(e=>e.k==="bday"&&e.who===ui.who&&Math.abs(e.day-day)<28)) return toast("Mỗi tháng chỉ có 1 sinh nhật thôi 😆");
  S.sched.push({id:S.sid++,day,k,who:ui.who});
  toast(ic(A[0])+" Đã dán "+A[1]+" · "+dayLabel(day)+(day===now?" (bắt đầu khi đóng lịch)":""));
  render(); openCal();
}
// chạy các sticker đã tới ngày; sticker có biểu diễn chờ tới khi không còn popup
function schTick(){
  const now=absDay(); let ran=false;
  for(const e of S.sched){if(e.done||e.day>now)continue;
    if(document.querySelector(".modal"))break;
    runSch(e,false); ran=true; break}
  if(ran)render(); return ran;
}
function runSch(e,quiet){
  e.done=1; const A=SCH[e.k], t=schWho(e.who); if(!t) return;
  const g=t.g||S.groups.find(x=>x.id===(S.idols[t.id]||{}).group), ids=t.ids.filter(id=>S.idols[id]&&!isOff(id));
  if(!ids.length){news(`📅 ${A[1]} của ${esc(t.name)} bị huỷ vì idol đang nghỉ`);return}
  if(!VIS[e.k]&&ids.every(id=>S.idols[id].stam<8)&&e.k!=="rest"&&e.k!=="bday"){news(`📅 ${A[1]} của ${esc(t.name)} bị huỷ: idol quá mệt`);if(!quiet)toast(`${ic(A[0])} Huỷ ${A[1]}: ${esc(t.name)} quá mệt`);return}
  const st=v=>ids.forEach(id=>S.idols[id].stam=clamp(S.idols[id].stam+v,0,100));
  const md=v=>ids.forEach(id=>addMind(id,v));
  const up=(k,v)=>ids.forEach(id=>{const i=S.idols[id];i[k]=clamp(i[k]+v,1,capOf(id))});
  const fa=(p,b)=>{if(!g)return 0;const f=Math.round((g.fans*p+b)*mktMul()*(t.g?1:.6));g.fans+=f;return f};
  const L=1+S.level*2; let r="";
  switch(e.k){
    case "practice":ids.forEach(id=>{const k=pick(["vo","da","da","vi","ch"]),i=S.idols[id];i[k]=clamp(i[k]+2,1,capOf(id))});st(-10);md(-1);r="+2 chỉ số";break;
    case "record":up("vo",2);st(-8);r="+2 Vocal";break;
    case "rest":st(20);md(8);r="+20 thể lực · +8 tinh thần";break;
    case "photo":{up("vi",2);st(-8);const m=Math.round(1.2e6*L*(1+idolTotal(t.id)/200));S.money+=m;r=`+2 Visual · +${money(m)}`;break}
    case "variety":up("ch",2);st(-8);r=`+2 Sức hút · +${fans(fa(.015,60))} fan`;break;
    case "live":md(5);r=`+${fans(fa(.008,30))} fan · +5 tinh thần`;break;
    case "fansign":st(-5);md(6);r=`+${fans(fa(.02,80))} fan · +6 tinh thần`;break;
    case "bday":md(15);r=`+15 tinh thần · +${fans(fa(.01,50))} fan · fan thuê biển quảng cáo ở ga Gangnam 🎂`;break;
    case "abroad":{st(-15);md(-2);const m=Math.round(2.5e6*L*ids.length);S.money+=m;r=`+${fans(fa(.03,100))} fan quốc tế · +${money(m)}`;break}
    case "offfan":{const c=1.5e6*(1+S.level);S.money-=c;st(-5);md(10);const f=fa(.04,150), q=clamp(.78+rnd(-.1,.12),.05,.97), song=g.songs[0]?g.songs[0].name:"Fanchant";
      r=`+${fans(f)} fan · cả nhóm +10 tinh thần`;
      const R={g,kind:"offfan",song,title:ic("s_offfan")+" Off fan",big:fans(ri(40,90)+Math.round(Math.sqrt(g.fans)*2))+" fan tham dự",res:`+${fans(f)} fan · cả nhóm +10 tinh thần ${ic("mind")} · chi phí ${money(c)}`,q};
      R.react=reactions(g,"offfan",q,song); if(!quiet)perform(R,()=>showResult(R)); break}
    case "lsale":{const fr=clamp((e.day-(g.lsLast==null?-99:g.lsLast))/28,.15,1); g.lsLast=e.day;
      const q=clamp(qual(g,1)+.15,.05,.97), sold=Math.round((g.fans*rnd(.1,.18)+30)*(.3+.7*fr)*(.7+q*.5)), rev=sold*2.5e4, so=fr>.9&&q>.6, f=fa(.01,40);
      S.money+=rev; g.lsSold=(g.lsSold||0)+sold; r=`bán ${fans(sold)} cây · +${money(rev)}`;
      const R={g,kind:"lsale",song:g.songs[0]?g.songs[0].name:"",title:ic("s_lsale")+(so?" SOLD OUT!":" Mở bán lightstick"),big:`<span style="color:${g.ls}">●</span> ${fans(sold)} cây`,
        res:`Doanh thu +${money(rev)} · +${fans(f)} fan${so?" · cháy hàng trong 3 phút!":""}${fr<.6?"<br><span class='muted'>Mở bán quá dày nên fan mua ít hơn (nên cách nhau 4 tuần)</span>":""}`,q,conf:so?80:0};
      R.react=reactions(g,"lsale",q,R.song); if(!quiet)showResult(R); break}
  }
  news(`📅 ${A[1]} · ${esc(t.name)}: ${r}`);
  if(!quiet&&!VIS[e.k])scene({ids,act:e.k,title:ic(A[0])+" "+A[1],sub:esc(t.name),res:r,hue:g?(g.id*67+320)%360:330});
}
function calCard(){
  if(!own().length)return "";
  const now=absDay(), up=S.sched.filter(e=>!e.done&&e.day>=now).sort((a,b)=>a.day-b.day).slice(0,4);
  return `<div class="card stack" style="gap:6px"><div class="row"><h3 class="sp">${ic("s_cal")} Lịch trình</h3><span class="muted">${DOW[now%7]} · ${yearWeek()}</span><button class="btn sm" data-a="cal">Mở lịch</button></div>
    ${up.length?up.map(e=>{const x=schWho(e.who);return `<div class="schrow">${ic(SCH[e.k][0])}<div class="sp"><b>${SCH[e.k][1]}</b> · ${x?(x.g?"cả nhóm ":"")+esc(x.name):"?"}</div><span class="tag">${dayLabel(e.day)}</span></div>`}).join("")
      :`<div class="muted">Chưa có lịch. Bấm <b>Mở lịch</b> để dán sticker lịch trình (luyện tập, fansign, off fan, bán lightstick, sinh nhật…) cho từng thành viên hoặc cả nhóm!</div>`}</div>`;
}
/* ---------- Lightstick chính thức ---------- */
const lsCost=()=>8e6*(1+S.level*2), LSC=["#ff6fae","#a98bff","#3fcf9f","#ffb938","#5fb4ff","#ff5d73"], LSH=[0,-75,-170,70,-120,22];
const lsImg=c=>`<img class="ic" src="assets/ic/s_lightstick.png" alt="" style="filter:hue-rotate(${LSH[LSC.indexOf(c)]||0}deg) drop-shadow(0 2px 3px rgba(0,0,0,.2))">`;
function lsDesign(gid){const g=S.groups.find(x=>x.id===gid); if(!g||g.ls)return;
  if(g.fans<1000) return toast("Cần 1.000 fan"); if(S.money<lsCost()) return toast("Cần "+money(lsCost()));
  modal(`<div class="stack center"><h3>${ic("s_lightstick")} Lightstick chính thức · ${esc(g.name)}</h3>
    <div class="muted">Chọn màu fandom. Biển lightstick ở mọi buổi diễn sẽ đổi sang màu này. Sau khi ra mắt, dán sticker ${ic("s_lsale")} <b>Mở bán lightstick</b> lên lịch để bán.</div>
    <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">${LSC.map(c=>`<button class="lsc" data-a="lsPick" data-g="${g.id}" data-c="${c}" style="--c:${c}" aria-label="Chọn màu ${c}">${lsImg(c)}</button>`).join("")}</div>
    <div class="muted">Chi phí thiết kế & sản xuất khuôn: <b>${money(lsCost())}</b></div><button class="btn ghost" data-a="close">Để sau</button></div>`);
}
function lsLaunch(gid,c){const g=S.groups.find(x=>x.id===gid); if(!g||g.ls||S.money<lsCost()||!LSC.includes(c))return;
  S.money-=lsCost(); g.ls=c; g.lsSold=0; news(`💡 ${esc(g.name)} công bố lightstick chính thức!`);
  const R={g,kind:"lsale",song:g.songs[0]?g.songs[0].name:"",title:lsImg(c)+" Ra mắt lightstick!",big:`<span style="color:${c}">●</span> Màu fandom ${esc(g.name)}`,
    res:`Fan đang háo hức chờ. Dán sticker ${ic("s_lsale")} <b>Mở bán lightstick</b> lên lịch để bắt đầu bán!`,q:clamp(.72+rnd(-.1,.15),.05,.97),conf:60};
  R.react=reactions(g,"lsale",R.q,R.song); showResult(R);
}

/* ================== CASTING (gacha) ================== */
function roll(minSR){
  S.pity++; let r;
  if(S.pity>=20){r=Math.random()<.2?"UR":"SSR"}
  else{const x=rnd(0,100);r=x<RAR.UR.rate?"UR":x<RAR.UR.rate+RAR.SSR.rate?"SSR":x<RAR.UR.rate+RAR.SSR.rate+RAR.SR.rate?"SR":"R"; if(minSR&&r==="R")r="SR"}
  if(r==="SSR"||r==="UR") S.pity=0;
  return pick(ROSTER.filter(x=>x.rar===r)).id;
}
function newSlots(){return lv().idols-own().length}
function pull(n,useT){
  const cost=n===1?3e6:1.3e7;
  if(useT&&S.tickets<n) return toast("Không đủ vé casting");
  if(!useT&&S.money<cost) return toast("Không đủ tiền");
  if(newSlots()<n) return toast(`Ký túc xá đầy (${own().length}/${lv().idols}). Nâng cấp công ty!`);
  if(useT)S.tickets-=n; else S.money-=cost;
  const res=[]; for(let i=0;i<n;i++){const id=roll(n>1&&i===n-1&&!res.some(x=>BY[x.id].rar!=="R"));
    if(S.idols[id]){const d=S.idols[id]; if(d.stars<5){d.stars++;STATS.forEach(([k])=>d[k]=Math.min(capOf(id),d[k]+4))} res.push({id,dup:true})}
    else{addIdol(id);res.push({id,dup:false})} S.st.pulls++}
  const best=res.some(x=>BY[x.id].rar==="UR")?"UR":res.some(x=>BY[x.id].rar==="SSR")?"SSR":"";
  res.forEach(x=>{if(!x.dup)news(`💌 ${BY[x.id].name} (${BY[x.id].rar}) gia nhập công ty`)});
  modal(`<div class="center"><h2>${ic("letter")} Kết quả casting</h2><div class="reveal">${res.map((x,i)=>{const r=BY[x.id];return `<div class="gcard ${r.rar} r${r.rar}" style="animation-delay:${i*.18}s">${av(x.id,84)}<span class="rar">${r.rar}</span><b>${esc(r.name)}</b><span class="muted">${x.dup?"Trùng → ★"+S.idols[x.id].stars:"MỚI! · "+esc(r.from)}</span></div>`}).join("")}</div>
    <button class="btn" data-a="close">Tuyệt vời!</button></div>`);
  if(best)confetti(best==="UR"?150:70); render();
}

/* ================== TUẦN MỚI ================== */
function weekTick(){
  const inc=Math.round(weeklySongIncome()), sal=own().reduce((a,id)=>a+5e4*RAR[BY[id].rar].salary*(1+S.level*2),0), rent=lv().rent;
  S.sched.forEach(e=>{if(!e.done&&e.day<S.week*7)runSch(e,true)}); // lịch chưa chạy của tuần cũ
  S.money+=inc-sal-rent; S.st.earned+=inc;
  S.groups.forEach(g=>{g.songs.forEach(s=>{if(s.age<12)g.fans+=Math.round(s.q*1.2*Math.pow(.85,s.age)*mktMul());s.age++;s.rank=clamp(Math.round(s.rank*rnd(1.15,1.5)+1),1,100)});
    g.fans+=Math.round(g.fans*.004)});
  own().forEach(id=>{const i=S.idols[id], low=i.stam<25;i.stam=Math.min(100,i.stam+35);
    addMind(id,2+S.care*1.5+(isOff(id)?10:0)-(low?6:0));
    if(i.off&&i.off===S.week+1&&i.trip){i.trip=0;news(`🏝️ ${BY[id].name} trở về từ Jeju, tràn đầy năng lượng`)}
    else if(i.off&&i.off===S.week+1){const g=S.groups.find(x=>x.id===i.group);i.stam=100;i.mind=Math.max(mindOf(id),70);if(g){const f=Math.round(g.fans*.08+300);g.fans+=f;news(`🎊 ${BY[id].name} chính thức trở lại cùng ${esc(g.name)}! +${fans(f)} fan`)}else news(`🎊 ${BY[id].name} đã trở lại công ty`)}});
  own().forEach(id=>{const i=S.idols[id];if(mindOf(id)<=10&&!isOff(id)){i.off=S.week+4;news(`🩺 ${BY[id].name} tạm ngừng hoạt động 3 tuần vì vấn đề sức khoẻ tinh thần. Hãy quan tâm idol nhiều hơn!`)}});
  S.rivals.forEach(r=>r.v*=rnd(1.001,1.007));
  S.week++; S.sched=S.sched.filter(e=>e.day>=(S.week-2)*7);
  return {inc,cost:sal+rent};
}
function nextWeek(){
  const r=weekTick();
  toast(`📅 ${yearWeek()} · +${money(r.inc)} nhạc số · -${money(r.cost)} lương & thuê`);
  if(S.money<0) news(`⚠️ Công ty đang âm tiền! Hãy cho idol hoạt động để kiếm thu nhập.`);
  if((S.week-1)%52===0) return awards(), render();
  if(Math.random()<.5) event();
  render();
}
function catchUp(n){
  const k=Math.min(n,OFFLINE_MAX), f0=totalFans(); let inc=0,cost=0,aw=false;
  for(let i=0;i<k;i++){const r=weekTick();inc+=r.inc;cost+=r.cost;if((S.week-1)%52===0){awards();aw=true}}
  S.weekStart=n>OFFLINE_MAX?Date.now():S.weekStart+n*WEEK_MS;
  news(`💤 ${k} tuần trôi qua khi bạn vắng mặt: +${money(inc)} nhạc số, -${money(cost)} chi phí`);
  const msg=`<div class="center stack"><div class="big">💤 Chào mừng trở lại!</div><div>Đã trôi qua <b>${k} tuần</b>${n>OFFLINE_MAX?" (tính bù tối đa "+OFFLINE_MAX+" tuần)":""}. Nhạc của công ty vẫn được stream.</div>
    <div class="hint">+${money(inc)} nhạc số · −${money(cost)} lương & thuê<br>+${fans(totalFans()-f0)} fan · idol đã hồi thể lực</div><button class="btn" data-a="close">Vào làm việc</button></div>`;
  if(aw) toast(`💤 ${k} tuần đã trôi qua`); else modal(msg);
  render();
}
const pad=n=>String(n).padStart(2,"0");
function clock(){
  const btn=document.getElementById("nextBtn");
  if(!S||!S.seenIntro){btn.hidden=true;return} btn.hidden=false;
  const left=S.weekStart+WEEK_MS-Date.now();
  if(left<=0){
    if(document.querySelector(".modal")){btn.innerHTML=ic("clock")+" Tuần mới đang chờ…";return}
    const n=Math.floor(-left/WEEK_MS)+1;
    if(n===1){S.weekStart+=WEEK_MS;nextWeek()} else catchUp(n);
    return clock();
  }
  if(schTick()&&ui.calOpen)openCal();
  btn.innerHTML=`${DOW[Math.min(6,Math.floor((WEEK_MS-left)/DAY_MS))]} · Tuần mới sau <span class="num">${Math.floor(left/6e4)}:${pad(Math.floor(left%6e4/1e3))}</span>`;
  btn.style.setProperty("--p",((1-left/WEEK_MS)*100).toFixed(1)+"%");
}
function awards(){
  const y=Math.floor((S.week-2)/52)+1, rk=myRank(), list=[];
  const best=[...S.groups].sort((a,b)=>b.fans-a.fans)[0];
  if(best){
    const rookie=S.groups.find(g=>g.debut>S.week-53&&g.fans>3e3);
    if(rookie) list.push(["🌱 Tân binh của năm",rookie.name,{money:2e7*(1+S.level),fans:5e3}]);
    if(rk<=6||best.trophies>=3) list.push(["🏅 Bonsang",best.name,{money:5e7*(1+S.level),fans:2e4}]);
    if(rk===1) {list.push(["👑 DAESANG – Nghệ sĩ của năm",best.name,{money:5e8*(1+S.level),fans:2e5}]);S.st.daesang++}
  }
  list.forEach(([,,r])=>{S.money+=r.money;best.fans+=r.fans});
  news(`🏆 Lễ trao giải cuối năm ${y}: ${list.length?list.map(x=>x[0]).join(", "):"chưa có giải"}`);
  modal(`<div class="center stack"><div class="big">${ic("trophy")} Lễ trao giải năm ${y}</div>${list.length?list.map(([t,n,r])=>`<div class="hint"><b>${t}</b><br>${esc(n)} · +${money(r.money)} · +${fans(r.fans)} fan</div>`).join(""):`<div class="hint">Năm nay công ty chưa nhận giải. Leo lên Top 6 BXH công ty để có Bonsang, Top 1 để có Daesang!</div>`}
    <div class="muted">Hạng hiện tại: #${rk} BXH công ty</div><button class="btn" data-a="close">Sang năm mới ✨</button></div>`);
  if(list.length)confetti(140);
}

/* ================== SỰ KIỆN ================== */
let EV=null;
function removeIdol(id){
  const i=S.idols[id], g=S.groups.find(x=>x.id===i.group);
  if(g){g.members=g.members.filter(x=>x!==id); if(!g.members.length){S.groups=S.groups.filter(x=>x!==g);news(`💔 ${esc(g.name)} tan rã vì không còn thành viên`)}}
  delete S.idols[id]; ui.pick=ui.pick.filter(x=>x!==id);
}
function event(){
  const L=1+S.level, coin=(p=.5)=>Math.random()<p, ids=own(), gs=S.groups.filter(g=>active(g).length);
  if(!ids.length) return;
  S.flags=S.flags||{};
  const g=gs.length?pick(gs):null, id=g?pick(active(g)):pick(ids), n=`<b>${BY[id].name}</b>`, I=S.idols[id];
  const loseF=(gg,p)=>{if(!gg)return "";const f=Math.round(gg.fans*p);gg.fans-=f;return `−${fans(f)} fan`};
  const addF=(gg,p,b=0)=>{if(!gg)return "";const f=Math.round(gg.fans*p+b);gg.fans+=f;return `+${fans(f)} fan`};
  const bump=(x,k,v)=>{const i=S.idols[x];i[k]=clamp(i[k]+v,1,capOf(x))};
  const song=g&&g.songs[0];
  // idol đủ điều kiện cho các drama đặc biệt
  const vets=ids.filter(x=>!isOff(x)&&S.week-(S.idols[x].renew||S.idols[x].joined||0)>=26);
  const army=ids.filter(x=>male(x)&&!isOff(x)&&!S.idols[x].served&&S.week-(S.idols[x].joined||0)>=40);
  const tired=ids.filter(x=>!isOff(x)&&(S.idols[x].stam<25||mindOf(x)<25));
  const blue=ids.filter(x=>!isOff(x)&&mindOf(x)<35);
  const rumor=S.flags.rumor&&S.idols[S.flags.rumor]?S.flags.rumor:null;
  const late=gs.find(x=>S.week-(x.lastSingle||x.debut)>=6);
  const top=pick(S.rivals.slice(0,4)).n;
  const pool=[];
  const add=(w,e)=>{for(let k=0;k<w;k++)pool.push(e)};

  /* ---------- DRAMA ---------- */
  if(g) add(2,{d:1,who:id,t:`📸 Paparazzi Daily đăng tin <b>${BY[id].name}</b> (${esc(g.name)}) bị bắt gặp đi dạo cùng một người lạ lúc nửa đêm!`,c:[
    ["Phủ nhận: “chỉ là bạn bè”",()=>{S.flags.rumor=id;return loseF(g,.03)+" · nhưng phóng viên vẫn đang theo dõi…"}],
    ["Công khai hẹn hò",()=>{const r=coin(.5)?addF(g,.04)+" · fan quốc tế chúc phúc 💕":loseF(g,.1)+" · fan nội địa phản đối";bump(id,"ch",4);return r}],
    ["Thuê luật sư (−"+money(3e6*L)+")",()=>{S.money-=3e6*L;return "Tin đồn lắng xuống"}]]});
  if(rumor){const rg=S.groups.find(x=>x.id===S.idols[rumor].group);
    add(4,{d:1,who:rumor,t:`📸 Paparazzi Daily tung bộ ảnh thứ 2: <b>${BY[rumor].name}</b> nắm tay người kia ở Jeju! Netizen nói công ty nói dối.`,c:[
    ["Xin lỗi & thừa nhận",()=>{S.flags.rumor=null;return loseF(rg,.06)+" · fan dần thông cảm"}],
    ["Tiếp tục phủ nhận",()=>{S.flags.rumor=null;return coin(.5)?"May mắn: ảnh bị chứng minh là ghép! "+addF(rg,.05):loseF(rg,.18)+" · khủng hoảng truyền thông!"}]]});}
  if(song) add(2,{d:1,who:id,t:`🎼 Netizen tố bài “${esc(song.name)}” của ${esc(g.name)} <b>đạo nhạc</b> một bài hát nước ngoài!`,c:[
    ["Ghi credit & mua bản quyền (−"+money(5e6*L)+")",()=>{S.money-=5e6*L;return "Sự việc khép lại êm đẹp"}],
    ["Phản bác, nhờ chuyên gia phân tích",()=>coin(.55)?"Chuyên gia kết luận không đạo! "+addF(g,.05):(song.age=12,"Bài bị gỡ khỏi BXH · "+loseF(g,.06))]]});
  if(song) add(2,{d:1,who:id,t:`🎙️ Clip ${n} bị nghi <b>hát nhép</b> ở show âm nhạc lan truyền khắp TikTok.`,c:[
    ["Đăng clip live giọng thật",()=>I.vo>=55||coin(.25)?`${BY[id].name} hát live quá đỉnh! `+addF(g,.08,200):`Hát live chênh phô… `+loseF(g,.06)],
    ["Im lặng chờ qua",()=>loseF(g,.03)]]});
  if(g) add(2,{d:1,who:id,t:`😠 Video ${n} cúi mặt, không cười ở fansign bị cắt ghép thành “thái độ với fan”.`,c:[
    ["Viết thư tay xin lỗi",()=>{bump(id,"ch",-3);return loseF(g,.02)+" · "+BY[id].name+" −3 Sức hút"}],
    ["Tung clip đầy đủ chứng minh",()=>coin(.6)?"Hoá ra idol đang khóc vì xúc động! "+addF(g,.06):"Clip đầy đủ cũng không giúp được… "+loseF(g,.07)]]});
  add(1,{d:1,who:id,t:`🕵️ Một sasaeng fan theo dõi ${n} tới tận ký túc xá và gửi tin nhắn lúc 3h sáng.`,c:[
    ["Thuê vệ sĩ (−"+money(2e6*L)+")",()=>{S.money-=2e6*L;return "Idol an toàn hơn"}],
    ["Chuyển ký túc xá (−"+money(6e6*L)+")",()=>{S.money-=6e6*L;ids.forEach(x=>S.idols[x].stam=Math.min(100,S.idols[x].stam+20));return "Cả công ty yên tâm · +20 thể lực mọi idol"}],
    ["Mặc kệ",()=>{I.stam=Math.max(0,I.stam-40);return BY[id].name+" hoảng sợ, mất ngủ (−40 thể lực)"}]]});
  if(g) add(1,{d:1,who:id,t:`🩹 ${n} bị <b>chấn thương mắt cá</b> khi tập vũ đạo cho comeback.`,c:[
    ["Cho nghỉ 2 tuần",()=>{I.off=S.week+2;return BY[id].name+" tạm nghỉ, nhóm hoạt động thiếu người"}],
    ["Diễn trên ghế",()=>{bump(id,"da",-4);return "Fan cảm phục tinh thần · "+addF(g,.05)+" · −4 Dance"}]]});
  if(tired.length){const t=pick(tired);add(2,{d:1,who:t,t:`😢 <b>${BY[t].name}</b> kiệt sức vì lịch trình dày đặc và xin <b>tạm dừng hoạt động</b>.`,c:[
    ["Cho nghỉ 3 tuần",()=>{S.idols[t].off=S.week+3;S.idols[t].stam=100;return BY[t].name+" về nhà nghỉ ngơi"}],
    ["Thuyết phục ở lại (−"+money(3e6*L)+" thưởng)",()=>{S.money-=3e6*L;S.idols[t].stam=60;return BY[t].name+" đồng ý ở lại"}]]})}
  if(vets.length){const v=pick(vets), cost=Math.round((1e7+idolTotal(v)*2e5)*L*RAR[BY[v].rar].salary);
    add(2,{d:1,who:v,t:`📝 Hợp đồng của <b>${BY[v].name}</b> sắp hết hạn. ${BY[v].name} đòi <b>tăng thù lao</b>, nếu không sẽ rời công ty!`,c:[
    ["Gia hạn (−"+money(cost)+")",()=>{S.money-=cost;S.idols[v].renew=S.week;STATS.forEach(([k])=>bump(v,k,2));return BY[v].name+" ở lại, hứng khởi +2 mọi chỉ số"}],
    ["Để "+BY[v].name+" ra đi",()=>{const gg=S.groups.find(x=>x.id===S.idols[v].group);const r=gg?loseF(gg,.12):"";removeIdol(v);return BY[v].name+" rời công ty 😭 "+r}]]})}
  if(ids.length>2){const v=pick(ids.filter(x=>!isOff(x)))||id, offer=Math.round((2e7+idolTotal(v)*4e5)*L);
    add(1,{d:1,who:v,t:`💸 ${esc(top)} bí mật liên hệ, muốn <b>chiêu mộ</b> ${BY[v].name} với giá ${money(offer)}!`,c:[
    ["Giữ lại bằng mọi giá",()=>{STATS.forEach(([k])=>bump(v,k,3));return BY[v].name+" cảm động, +3 mọi chỉ số"}],
    ["Bán hợp đồng (+"+money(offer)+")",()=>{S.money+=offer;const gg=S.groups.find(x=>x.id===S.idols[v].group);const r=gg?loseF(gg,.15):"";removeIdol(v);return `${BY[v].name} chuyển sang ${top} · ${r}`}]]})}
  if(army.length){const v=pick(army),gg=S.groups.find(x=>x.id===S.idols[v].group);
    add(3,{d:1,who:v,t:`🎖️ <b>${BY[v].name}</b> nhận giấy báo <b>nhập ngũ</b>. Anh ấy sẽ vắng mặt 12 tuần.`,c:[
    ["Fan meeting chia tay (−"+money(4e6*L)+")",()=>{S.money-=4e6*L;S.idols[v].off=S.week+12;S.idols[v].served=1;return "Buổi chia tay đầy nước mắt "+addF(gg,.06,300)}],
    ["Lặng lẽ lên đường",()=>{S.idols[v].off=S.week+12;S.idols[v].served=1;return BY[v].name+" nhập ngũ. Fan hẹn ngày trở về"}]]})}
  if(late) add(2,{d:1,who:pick(active(late)),t:`📢 Fandom của <b>${esc(late.name)}</b> gửi xe tải biểu tình trước công ty: “Đã ${S.week-(late.lastSingle||late.debut)} tuần không comeback!”`,c:[
    ["Hứa comeback sớm",()=>loseF(late,.02)+" · hãy ra single ngay!"],
    ["Tặng quà xin lỗi fan (−"+money(2e6*L)+")",()=>{S.money-=2e6*L;return addF(late,.02)}]]});
  if(g&&g.lastSingle===S.week-1) add(1,{d:1,who:id,t:`🔓 Bản demo bài mới của ${esc(g.name)} bị <b>leak</b> lên mạng trước ngày phát hành!`,c:[
    ["Biến nguy thành cơ: tung teaser",()=>addF(g,.04)],
    ["Truy cứu người làm lộ (−"+money(2e6*L)+")",()=>{S.money-=2e6*L;return "Đã tìm ra thủ phạm"}]]});
  if(g) add(2,{d:1,who:id,t:`😡 Anti-fan tấn công <b>${esc(g.name)}</b> bằng hàng nghìn bình luận ác ý.`,c:[
    ["Khởi kiện (−"+money(4e6*L)+")",()=>{S.money-=4e6*L;return "Fandom đoàn kết hơn! "+addF(g,.03)}],
    ["Lờ đi",()=>loseF(g,.04)]]});
  if(tired.length||coin(.3)) add(1,{d:1,who:id,t:`🤒 ${n} bị sốt cao vì lịch trình dày đặc.`,c:[
    ["Cho nghỉ hẳn",()=>{I.stam=100;return BY[id].name+" hồi phục hoàn toàn"}],
    ["Tiếp tục lịch trình",()=>{I.stam=Math.max(0,I.stam-30);return "Fan cảm động "+addF(g,.02)+" nhưng idol kiệt sức"}]]});

  if(blue.length){const b=pick(blue), bg=S.groups.find(x=>x.id===S.idols[b].group);
    add(5,{d:1,nm:1,who:b,t:`🌙 3 giờ sáng, <b>${BY[b].name}</b> đăng story “mệt quá, không biết mình cố gắng vì điều gì nữa” rồi xoá ngay. Fan lo lắng!`,c:[
    ["Đưa đi gặp chuyên gia tâm lý (−"+money(4e6*L)+")",()=>{S.money-=4e6*L;addMind(b,35);return BY[b].name+" +35 tinh thần · fan an tâm"}],
    ["Cho nghỉ 2 tuần",()=>{S.idols[b].off=S.week+2;addMind(b,25);return BY[b].name+" tạm nghỉ 2 tuần để hồi phục"}],
    ["Bảo idol im lặng cho qua",()=>{addMind(b,-10);return loseF(bg,.04)+" · netizen chỉ trích công ty vô tâm · "+BY[b].name+" −10 tinh thần"}]]});}
  if(g&&g.fans>=300) add(2,{who:id,t:`☕ Fandom của ${esc(g.name)} tự tổ chức <b>off fan</b> ở một quán cà phê Hongdae. Có nên cho ${n} ghé thăm bất ngờ?`,c:[
    ["Ghé thăm bất ngờ",()=>{addMind(id,8);I.stam=Math.max(0,I.stam-10);return addF(g,.04,120)+" · clip viral khắp mạng"}],
    ["Gửi xe cà phê & quà (−"+money(1.5e6*L)+")",()=>{S.money-=1.5e6*L;return addF(g,.025,60)+" · fan cảm động"}],
    ["Để fan tự vui",()=>"Off fan vẫn vui vẻ"]]});
  if(g&&g.ls) add(2,{who:id,t:`🛍️ Lightstick của ${esc(g.name)} bị đầu cơ, giá chợ đen gấp 5 lần! Fan kêu gọi tái bản.`,c:[
    ["Tái sản xuất ngay (−"+money(3e6*L)+")",()=>{S.money-=3e6*L;const k=Math.round(g.fans*.06),m=k*2.5e4;S.money+=m;g.lsSold=(g.lsSold||0)+k;return `Bán thêm ${fans(k)} cây · +${money(m)} · `+addF(g,.02)}],
    ["Mặc kệ",()=>loseF(g,.01)+" · fan hơi buồn"]]});
  if(g&&!g.ls&&g.fans>=1000) add(1,{who:id,t:`💡 Fan của ${esc(g.name)} lập hashtag đòi công ty ra <b>lightstick chính thức</b>!`,c:[["Hứa sẽ ra mắt sớm",()=>{addF(g,.01);return "Vào tab Nhóm để thiết kế lightstick"}]]});

  /* ---------- TIN VUI ---------- */
  if(g) add(2,{who:id,t:`📱 Fancam của ${n} (${esc(g.name)}) đạt 10 triệu view trên TikTok!`,c:[
    ["Đẩy quảng bá (−"+money(2e6*L)+")",()=>{S.money-=2e6*L;return addF(g,.2,500)}],["Để tự nhiên",()=>addF(g,.05,100)]]});
  if(g) add(1,{who:id,t:`🤣 ${n} vấp ngã trên sân khấu nhưng đứng dậy cười tươi diễn tiếp. Clip lên top trending!`,c:[["Đáng yêu quá!",()=>{bump(id,"ch",3);return addF(g,.07,200)+" · +3 Sức hút"}]]});
  add(1,{who:id,t:`✨ ${n} lọt top “100 gương mặt đẹp nhất năm” của TC Candler!`,c:[["Tự hào!",()=>{bump(id,"vi",5);return "+5 Visual "+addF(g,.04)}]]});
  add(2,{who:id,t:`💄 Một thương hiệu xa xỉ muốn mời ${n} làm đại sứ toàn cầu.`,c:[
    ["Nhận hợp đồng",()=>{const m=Math.round((3e6+idolTotal(id)*1e5)*(1+S.level*2));S.money+=m;I.stam=Math.max(0,I.stam-30);return `+${money(m)} ${addF(g,.03)} · ${BY[id].name} hơi mệt`}],
    ["Từ chối để tập luyện",()=>{train(id,"vo",true);return BY[id].name+" tập thêm vocal"}]]});
  add(2,{who:id,t:`📺 Show thực tế “Running Idol” mời ${n} làm khách mời.`,c:[
    ["Tham gia",()=>{bump(id,"ch",5);return "+5 Sức hút "+addF(g,.04,300)}],["Bỏ qua",()=>"Không có gì xảy ra"]]});
  add(1,{t:`🎒 Một bạn trẻ hát rong được phát hiện ở Hongdae, xin thử giọng tại công ty!`,c:[["Nhận vé casting",()=>{S.tickets++;return "+1 vé casting"}]]});
  add(1,{t:`💼 Một quỹ đầu tư muốn rót vốn vào ${esc(S.company)}.`,c:[
    ["Nhận "+money(1e7*(1+S.level*4)),()=>{S.money+=1e7*(1+S.level*4);return "Tiền về tài khoản!"}],
    ["Giữ độc lập",()=>{S.tickets++;return "+1 vé casting từ đối tác"}]]});
  if(song) add(1,{who:id,t:`🔁 Bài “${esc(song.name)}” bất ngờ <b>đảo ngược BXH</b> nhờ một clip cover viral!`,c:[["Tuyệt!",()=>{song.age=Math.max(0,song.age-3);song.rank=Math.max(1,Math.round(song.rank/3));S.st.bestRank=Math.min(S.st.bestRank,song.rank);return `Leo lên #${song.rank}`}]]});

  EV=pick(pool);
  modal(`<div class="stack"><div class="row">${EV.who?av(EV.who,56):""}<h3 class="sp" style="color:${EV.d?"var(--red)":"var(--mint)"}">${EV.d?ic("drama")+" DRAMA":ic("star")+" Tin vui"}</h3></div>
    <div style="font-size:16px">${EV.t}</div>${EV.c.map((c,i)=>`<button class="btn ${i?"ghost":""}" data-a="ev" data-i="${i}">${c[0]}</button>`).join("")}</div>`,true);
}
function evPick(i){let r=EV.c[i][1]();
  if(EV.who&&S.idols[EV.who]&&!EV.nm){const v=EV.d?-ri(6,12):5;addMind(EV.who,v);r+=` · ${BY[EV.who].name} ${v>0?"+":""}${v} tinh thần`}
  news((EV.d?"🔥 ":"")+EV.t.replace(/<[^>]+>/g,"")+" → "+r); EV=null; closeModal(); toast(r); render()}

/* ================== CÔNG TY ================== */
function myScore(){return totalFans()+S.groups.reduce((a,g)=>a+g.trophies,0)*1000}
function myRank(){const m=myScore();return 1+S.rivals.filter(r=>r.v>m).length}
const equipCost=()=>2e6*Math.pow(2.3,S.equip), mktCost=()=>5e6*Math.pow(2.4,S.mkt);
function upgrade(){const n=LV[S.level+1]; if(!n)return;
  if(S.money<n.cost||totalFans()<n.fans) return toast(`Cần ${money(n.cost)} và ${fans(n.fans)} fan`);
  S.money-=n.cost;S.level++;news(`🏢 Công ty chuyển lên: ${n.name}!`);
  modal(`<div class="center stack"><div class="big">${ic("company")} Lên cấp!</div><div class="hero"><div class="bgimg" style="background-image:url(assets/${n.bg}.jpg)"></div></div><h2>${n.name}</h2>
    <div>Ký túc xá: ${n.idols} idol · Tối đa ${n.groups} nhóm<br>Concert sức chứa ${fans(n.cap)}</div><button class="btn" data-a="close">Khai trương!</button></div>`);confetti(150);render()}
const careCost=()=>3e6*Math.pow(2.3,S.care);
function buy(k){const c={equip:equipCost,mkt:mktCost,care:careCost}[k](); if(S.money<c)return toast("Không đủ tiền"); if(S[k]>=10)return toast("Đã tối đa");S.money-=c;S[k]++;
  toast({equip:"🏋️ Phòng tập nâng cấp: +1 điểm mỗi buổi tập",mkt:"📣 Marketing nâng cấp: +12% fan",care:ic("therapy")+" Phòng chăm sóc tinh thần nâng cấp"}[k]);render()}
function openCare(id){
  const i=S.idols[id], v=mindOf(id), m=moodOf(v), g=S.groups.find(x=>x.id===i.group), used=i.cared===S.week;
  modal(`<div class="stack"><div class="row">${av(id,64)}<div class="sp"><h3>${esc(BY[id].name)}</h3><div class="muted">${m[0]} ${m[1]} · tinh thần <b class="num">${v}</b>/100</div>
    <div class="moodbar" style="height:10px;background:var(--line);border-radius:9px;margin-top:4px"><span style="width:${v}%;background:${m[2]}"></span></div></div></div>
    ${used?`<div class="hint">Tuần này đã chăm sóc ${esc(BY[id].name)} rồi. Quay lại tuần sau nhé!</div>`:`<div class="muted">Chọn 1 cách chăm sóc mỗi tuần:</div>`}
    ${CARE.map(([k,icn,name,cost,gain,desc])=>{const c=cost*(1+S.level), why=used?"Đã chăm sóc":(k==="trip"&&isOff(id))?"Đang nghỉ":(k==="letter"&&(!g||g.fans<5000))?"Cần 5K fan":S.money<c?"Thiếu tiền":"";
      return `<button class="care" data-a="doCare" data-id="${id}" data-k="${k}" ${why?"disabled":""} style="${why?"opacity:.55":""}">${ic(icn,"lg")}<div class="sp"><b>${name}</b><div class="muted" style="font-size:12px">${desc}</div></div><div class="num center" style="font-size:12px;white-space:nowrap">${why||(c?money(c):"Miễn phí")}<br><b style="color:var(--mint)">+${gain}</b></div></button>`}).join("")}
    <div class="muted" style="font-size:12px">${ic("mind")} Tinh thần cũng tăng khi: nghỉ ngơi, dán sticker Ngày nghỉ / Sinh nhật, bình luận tích cực, thắng cúp, nâng cấp Phòng chăm sóc tinh thần. Giảm khi: bị chửi trên mạng, drama, làm việc quá sức.</div>
    <button class="btn ghost" data-a="close">Đóng</button></div>`);
}
function doCare(id,k){
  const C=CARE.find(x=>x[0]===k), i=S.idols[id], c=C[3]*(1+S.level); if(!i||i.cared===S.week||S.money<c)return;
  S.money-=c; i.cared=S.week; const nm=BY[id].name;
  const g=S.groups.find(x=>x.id===i.group); let ids=[id], res;
  if(k==="bbq"){ids=(g?g.members:[id]).filter(x=>!isOff(x)||x===id);ids.forEach(x=>addMind(x,C[4]));res="Cả nhóm ăn thịt nướng no nê, cười nói rôm rả: mọi người +10 tinh thần"}
  else if(k==="trip"){i.off=S.week+1;i.trip=1;i.mind=100;i.stam=100;news(`🏝️ ${nm} đi nghỉ ở Jeju 1 tuần`);res=nm+" nghỉ dưỡng ở Jeju 1 tuần: tinh thần & thể lực hồi đầy 100"}
  else{addMind(id,C[4]);res=nm+" "+{chat:"đã trút hết tâm sự với CEO",letter:"đọc thư tay của fan mà khóc vì xúc động",therapy:"cảm thấy nhẹ nhõm hơn sau buổi tư vấn"}[k]+`: +${C[4]} tinh thần`}
  scene({ids,act:k,title:ic(C[1])+" "+C[2],res:res+` ${ic("mind")}`,hue:g?(g.id*67+320)%360:330}); render();
}
function claim(){const i=S.claimed, m=MISSIONS[i]; if(!m||!m[1](S))return; const r=m[2];
  if(r.money)S.money+=r.money; if(r.tickets)S.tickets+=r.tickets; S.claimed++;
  toast(`🎁 Hoàn thành “${m[0]}”: ${r.money?"+"+money(r.money):""}${r.tickets?" +"+r.tickets+" vé":""}`);confetti(40);
  const k=qlvOf(i); if(S.claimed===qlvEnd(k)){const b=QLV[k][2]; if(b.money)S.money+=b.money; if(b.tickets)S.tickets+=b.tickets;
    news(`🏅 Hoàn thành Level ${k+1} · ${QLV[k][1]}`);
    modal(`<div class="center stack"><div class="big">🏅 Level ${k+1} hoàn thành!</div><h2>${QLV[k][1]}</h2><div>Thưởng Level: <b>${b.money?money(b.money):""}${b.money&&b.tickets?" + ":""}${b.tickets?b.tickets+" vé casting":""}</b></div>${QLV[k+1]?`<div class="muted">Mở khoá Level ${k+2} · ${QLV[k+1][1]}</div>`:`<div class="muted">Bạn đã hoàn thành toàn bộ chuỗi nhiệm vụ 👑</div>`}<button class="btn" data-a="close">Tuyệt vời!</button></div>`);confetti(150)}
  render()}
function today(){const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()}
function daily(){if(S.daily===today())return;
  const y=new Date(Date.now()-864e5), ys=y.getFullYear()+"-"+(y.getMonth()+1)+"-"+y.getDate();
  S.streak=S.daily===ys?Math.min(S.streak+1,7):1; S.daily=today();
  const t=S.streak>=7?3:S.streak>=3?2:1, m=1e6*S.streak*(1+S.level*3); S.tickets+=t; S.money+=m;
  modal(`<div class="center stack"><div class="big">${ic("gift")} Quà điểm danh</div><div>Chuỗi ${S.streak} ngày liên tiếp ${"🔥".repeat(Math.min(S.streak,7))}</div><div class="hint">+${t} vé casting · +${money(m)}</div><div class="muted">Quay lại mỗi ngày để quà lớn dần (tối đa ngày 7)</div><button class="btn" data-a="close">Nhận quà</button></div>`);confetti(50);render()}

/* ================== MODAL ================== */
let modalLock=false;
function modal(html,lock){modalLock=!!lock;ui.calOpen=false;document.getElementById("modalRoot").innerHTML=`<div class="modal" data-a="bg"><div class="box">${html}</div></div>`}
function closeModal(){if(mg){cancelAnimationFrame(mg.raf);mg=null}if(PF){PF.timers.forEach(clearInterval);clearTimeout(PF.to);PF=null}Music.stop();ui.calOpen=false;document.getElementById("modalRoot").innerHTML="";modalLock=false}

/* ================== GIAO DIỆN ================== */
const TABS=[["home",ic("company"),"Trụ sở"],["idols",ic("star"),"Idol"],["groups",ic("mic"),"Nhóm"],["cast",ic("letter"),"Casting"],["quest",ic("target"),"Nhiệm vụ"]];
function hint(){
  if(!S.groups.length) return own().length<2?"Casting thêm thực tập sinh ở tab "+ic("letter")+"":"Luyện tập idol rồi vào tab "+ic("mic")+" để <b>debut nhóm đầu tiên</b>!";
  const sad=own().filter(id=>mindOf(id)<25&&!isOff(id));
  if(sad.length) return `${BY[sad[0]].name} đang kiệt quệ tinh thần ${moodOf(0)[0]}. Vào tab ${ic("star")} bấm <b>Chăm sóc</b> trước khi idol phải tạm nghỉ!`;
  const g=S.groups[0];
  if(!g.songs.length) return `Cho <b>${esc(g.name)}</b> hát đường phố rồi <b>phát hành single</b> đầu tiên.`;
  if(S.groups.some(g=>g.acted!==S.week)) return "Còn nhóm chưa hoạt động tuần này. Vào tab "+ic("mic")+" nhé!";
  return "Mọi nhóm đã hoạt động. Chờ tuần mới ⏳ để nhận tiền nhạc số. Trong lúc chờ: luyện tập, casting, đầu tư.";
}
function todo(){
  const canTrain=own().some(id=>S.idols[id].stam>=20)&&S.money>=trainCost();
  const items=[
    ["train","Luyện tập idol",S.trainWeek===S.week||!canTrain,"idols"],
    S.groups.length?["mic","Mỗi nhóm 1 hoạt động · "+S.groups.filter(g=>g.acted===S.week).length+"/"+S.groups.length,S.groups.every(g=>g.acted===S.week),"groups"]
      :["visual","Debut nhóm đầu tiên (cần 2+ idol)",false,"groups"],
    S.tickets>0&&newSlots()>0&&["ticket","Dùng "+S.tickets+" vé casting",false,"cast"],
    own().some(id=>mindOf(id)<40&&S.idols[id].cared!==S.week)&&["mind","Chăm sóc idol đang căng thẳng",false,"idols"],
    S.groups.length&&["s_cal","Dán sticker lịch trình",S.sched.some(e=>Math.floor(e.day/7)===S.week-1),"cal"],
    MISSIONS[S.claimed]&&MISSIONS[S.claimed][1](S)&&["target","Nhận thưởng nhiệm vụ",false,"quest"],
  ].filter(Boolean);
  const nd=items.filter(x=>x[2]).length, first=items.findIndex(x=>!x[2]);
  return `<div class="card stack" style="gap:10px"><div class="hh"><span class="ib">${ic("calendar")}</span><h3>Việc tuần này</h3><b class="num" style="color:${nd===items.length?"var(--mint)":"var(--pink)"}">${nd}/${items.length}</b></div>
    <div class="prog m"><span style="width:${nd/items.length*100}%"></span></div>
    <div class="tgrid">${items.map(([e,t,ok,tb],k)=>`<button class="tile ${ok?"done":k===first?"hot":""}" data-a="${tb==="cal"?"cal":"tab"}" data-k="${tb}">${ic(e)}<span class="sp">${t}</span>${ok?ic("check","ck"):""}</button>`).join("")}</div>
    <div class="muted center">${nd===items.length?"Xong hết rồi! Tuần mới sẽ tự đến, mang theo tiền nhạc số và thể lực.":"Mỗi tuần kéo dài "+WEEK_MIN+" phút. Làm trước khi hết giờ nhé!"}</div></div>`;
}
function mgrPose(){
  if(MISSIONS[S.claimed]&&MISSIONS[S.claimed][1](S))return "m_cheer";
  if(own().some(id=>mindOf(id)<25&&!isOff(id)))return "m_worry";
  if(S.groups.length&&S.groups.every(g=>g.acted===S.week))return "m_sleep";
  return "m_wave";
}
function viewHome(){
  const L=lv(), n=LV[S.level+1], tf=totalFans(), rk=myRank();
  const stageIds=S.groups.flatMap(g=>g.members).slice(0,7), showIds=stageIds.length?stageIds:own().slice(0,5), mid=Math.floor((showIds.length-1)/2);
  const all=[...S.rivals.map(r=>({n:r.n,v:r.v})),{n:S.company,v:myScore(),me:1}].sort((a,b)=>b.v-a.v);
  const idx=all.findIndex(x=>x.me), lo=Math.max(0,Math.min(idx-2,all.length-5)), view=all.slice(lo,lo+5), top=Math.max(1,...view.map(x=>x.v));
  const fp=n?Math.min(100,tf/n.fans*100):100, mp=n?Math.min(100,S.money/n.cost*100):100;
  const cost=own().reduce((a,id)=>a+5e4*RAR[BY[id].rar].salary*(1+S.level*2),0)+L.rent;
  const INV=[["equip","train","Phòng tập",S.equip,`+${S.equip} điểm/buổi tập`,equipCost,"#fff7fb","var(--pink)"],
    ["care","therapy","Chăm sóc tinh thần",S.care,`+${2+S.care*1.5} tinh thần/tuần`,careCost,"#f6f1ff","var(--lav)"],
    ["mkt","mkt","Marketing",S.mkt,`+${S.mkt*12}% fan mọi hoạt động`,mktCost,"#effcf6","var(--mint)"]];
  const SP=[[12,18],[30,8],[70,12],[86,24],[52,6],[20,40],[80,44]];
  return `<div class="stack">
  <div class="hero2"><div class="bgimg" style="background-image:url(assets/${L.bg}.jpg)${L.fx?";filter:"+L.fx:""}"></div>
    <div class="beam b1"></div><div class="beam b2"></div>${SP.map(([x,y],k)=>`<i class="spark" style="left:${x}%;top:${y}%;animation-delay:${-k*.45}s">✦</i>`).join("")}
    <div class="badge lvb"><span class="ring" style="--p:${n?Math.round(Math.min(fp,mp)):100}"><span>${ic("hq")}</span></span><span>Cấp ${S.level+1}<small>${L.name}</small></span></div>
    <button class="badge rkb" data-a="rankInfo"><span>Hạng<small>BXH công ty</small></span><b class="num">#${rk}</b>${ic(rk<=3?"crown":"trophy")}</button>
    <div class="floor"></div>
    <div class="stage2">${showIds.map((id,k)=>`<div class="who ${k===mid?"mid":""}" data-a="tab" data-k="idols">${av(id,k===mid?64:50)}<b class="r${BY[id].rar}">${esc(BY[id].name)}</b></div>`).join("")}</div>
    <div class="over2"><h1>${esc(S.company)}</h1><div class="hchips"><span>${ic("mic")} ${S.groups.length} nhóm</span><span>${ic("star")} ${own().length}/${L.idols} idol</span><span>${ic("coins")} ${money(weeklySongIncome())}/tuần</span></div></div></div>
  <div class="mgr"><img src="assets/ic/${mgrPose()}.png" alt=""><div class="bub"><small>QUẢN LÝ THỎ</small>${hint()}</div></div>
  ${todo()}
  ${calCard()}
  <div class="card stack" style="gap:8px"><div class="hh"><span class="ib" style="--hb:#fff6df">${ic("hq")}</span><h3>Lộ trình trụ sở</h3>${n?`<span class="muted">tiếp: ${n.name}</span>`:""}</div>
    <div class="path" style="--n:${LV.length}"><div class="fill" style="width:calc(100% * ${S.level} / var(--n))"></div>${LV.map((x,k)=>`<div class="node ${k<S.level?"past":k===S.level?"cur":"lock"}"><i style="background-image:url(assets/${x.bg}.jpg)${x.fx?";filter:"+x.fx:""}">${k<S.level?ic("check","tagi"):k>S.level?ic("lock","tagi"):""}</i>${x.name}</div>`).join("")}</div>
    ${n?`<div class="kv">${ic("fans")}<div class="prog"><span style="width:${fp}%"></span></div><span class="num">${fans(tf)} / ${fans(n.fans)}</span>
      ${ic("coins")}<div class="prog g"><span style="width:${mp}%"></span></div><span class="num">${money(S.money)} / ${money(n.cost)}</span></div>
      <div class="row"><div class="muted sp">Mở khoá: ${n.idols} idol · ${n.groups} nhóm · concert ${fans(n.cap)} chỗ</div><button class="btn gold" data-a="upgrade" ${S.money>=n.cost&&tf>=n.fans?"":"disabled"}>${ic("rocket")} Nâng cấp</button></div>`
      :`<div class="center"><b>${ic("crown")} Bạn đã đạt cấp cao nhất: ${L.name}!</b></div>`}</div>
  <div class="card stack" style="gap:10px"><div class="hh"><span class="ib" style="--hb:#f1ebff">${ic("chart")}</span><h3>Đầu tư</h3></div>
    <div class="inv">${INV.map(([k,icn,nm,l,eff,cf,tb,pc])=>`<div style="--tb:${tb};--pc:${pc}">${ic(icn,"lg")}<b>${nm}</b><div class="pips">${Array.from({length:10},(_,j)=>`<i class="${j<l?"on":""}"></i>`).join("")}</div><div class="muted">${eff}</div>
      <button class="btn lav sm" data-a="buy" data-k="${k}" ${l>=10?"disabled":""}>${l>=10?"MAX":money(cf())}</button></div>`).join("")}</div></div>
  <div class="card stack" style="gap:4px"><div class="hh" style="margin-bottom:4px"><span class="ib" style="--hb:#fff6df">${ic("trophy")}</span><h3>BXH công ty</h3><span class="muted">fan + cúp×1000</span></div>
    ${view.map(x=>{const p=all.indexOf(x)+1;return `<div class="rk2 ${x.me?"me":""}"><span class="pos">${p<=3?ic("medal"+p):"#"+p}</span><div><span class="nm">${esc(x.n)}${x.me?" (bạn)":""}</span><div class="bar"><span style="width:${x.v/top*100}%;background:${x.me?"linear-gradient(90deg,var(--pink),var(--lav))":"var(--lav2)"}"></span></div></div><span class="num">${fans(x.v)}</span></div>`}).join("")}</div>
  ${S.feed.length?`<div class="card stack" style="gap:6px"><div class="hh"><span class="ib">${ic("comment")}</span><h3>Cộng đồng mạng</h3></div><div class="cmts">${S.feed.slice(0,5).map(c=>cmtHtml(c,0,false)).join("")}</div></div>`:""}
  <div class="card"><div class="hh" style="margin-bottom:8px"><span class="ib" style="--hb:#effcf6">${ic("news")}</span><h3>Bảng tin</h3></div><div class="news">${S.news.length?S.news.map(t=>`<div>${t}</div>`).join(""):`<div>Chào mừng CEO! Hãy bắt đầu bằng việc luyện tập thực tập sinh.</div>`}</div></div>
  <div class="money2"><div class="in">${ic("chart")}<span>Nhạc số/tuần<b class="num">+${money(weeklySongIncome())}</b></span></div><div class="out">${ic("coins")}<span>Chi phí/tuần<b class="num">-${money(cost)}</b></span></div></div>
  </div>`;
}
function viewIdols(){
  const ids=own().sort((a,b)=>idolTotal(b)-idolTotal(a));
  return `<div class="stack"><div class="row"><h2 class="sp">${ic("star")} Idol (${ids.length}/${lv().idols})</h2><button class="btn mint sm" data-a="trainAll">${ic("train")} Luyện tất cả</button></div>
  <div class="muted">Mỗi buổi tập: ${money(trainCost())} · −20 thể lực · +2~5${S.equip?"+"+S.equip:""} điểm. Thể lực hồi +35 mỗi tuần.</div>
  ${ids.map(id=>{const r=BY[id],i=S.idols[id],cap=capOf(id),g=S.groups.find(g=>g.id===i.group);
    return `<div class="card idol">${av(id,64)}<div class="sp"><div class="row" style="gap:6px;flex-wrap:wrap"><b style="font-family:var(--display);font-size:17px">${esc(r.name)}</b><span class="rar r${r.rar}">${r.rar}</span>${stars(i.stars)}<span class="tag">${g?esc(g.name):"Thực tập sinh"}</span>${isOff(id)?`<span class="tag" style="background:#ffe1e6;color:#c23a55">🛌 nghỉ đến T${i.off}</span>`:""}</div>
    <div class="bars" style="margin-top:6px">${STATS.map(([k,n,c,e])=>`<span>${e} ${n}</span><div class="bar"><span style="width:${i[k]/cap*100}%;background:${c}"></span></div><button class="btn ghost sm num" data-a="train" data-id="${id}" data-k="${k}" ${i[k]>=cap?"disabled":""}>${i[k]}${i[k]>=cap?" max":" +"}</button>`).join("")}</div>
    <div class="row muted" style="margin-top:4px;font-size:12px"><span>${ic("train")} Thể lực ${i.stam}</span><span class="sp stam"><span style="width:${i.stam}%"></span></span><span>Tổng ${idolTotal(id)}/${cap*4}</span></div>
    <div class="row muted" style="margin-top:4px;font-size:12px">${(m=>`<span>${m[0]} Tinh thần ${mindOf(id)}</span><span class="sp stam"><span style="width:${mindOf(id)}%;background:${m[2]}"></span></span>`)(moodOf(mindOf(id)))}<button class="btn sm ${mindOf(id)<40&&i.cared!==S.week?"":"ghost"}" data-a="care" data-id="${id}">${ic("mind")} Chăm sóc</button></div></div></div>`}).join("")}
  </div>`;
}
function viewGroups(){
  const free=own().filter(id=>!S.idols[id].group), dcost=2e6*(1+S.level*3);
  return `<div class="stack"><h2>${ic("mic")} Nhóm nhạc (${S.groups.length}/${lv().groups})</h2>
  ${S.groups.map(g=>{const p=power(g);return `<div class="card stack"><div class="row"><div class="sp"><h2>${esc(g.name)}</h2><div class="muted num">${ic("fans")} ${fans(g.fans)} fan · ${ic("trophy")} ${g.trophies} cúp · ⚡ Sức mạnh ${p}</div></div><button class="btn ghost sm" data-a="askDisband" data-g="${g.id}">⋯</button></div>
    ${miniStage(g)}
    <div class="row wrap" style="gap:6px">${g.members.map(id=>`<div class="dex" style="${isOff(id)?"opacity:.45":""}">${av(id,48)}<span>${isOff(id)?"🛌 ":moodOf(mindOf(id))[0]+" "}${esc(BY[id].name)}</span><div class="stam" style="width:44px"><span style="width:${S.idols[id].stam}%"></span></div></div>`).join("")}</div>
    ${g.songs.length?`<div class="stack" style="gap:4px">${g.songs.slice(0,3).map(s=>`<div class="song"><b>#${s.rank}</b><span class="sp">“${esc(s.name)}”</span><span class="muted">${s.age<12?"+"+money(songIncome(g,s))+"/tuần":"hết thời"}</span></div>`).join("")}</div>`:""}
    ${g.ls?`<div class="schrow"><span class="lsc" style="--c:${g.ls};width:38px;height:38px;border-radius:12px;cursor:default">${lsImg(g.ls)}</span><div class="sp"><b>Lightstick chính thức</b><div class="muted">Đã bán ${fans(g.lsSold||0)} cây · dán sticker ${ic("s_lsale")} lên lịch để mở bán</div></div><button class="btn ghost sm" data-a="cal">${ic("s_cal")}</button></div>`
      :`<button class="btn ghost sm" data-a="lsMake" data-g="${g.id}" ${g.fans<1000?"disabled":""}>${ic("s_lightstick")} Thiết kế lightstick chính thức · ${g.fans<1000?"cần 1.000 fan":money(lsCost())}</button>`}
    ${g.acted===S.week?`<div class="hint center">✅ Đã hoạt động tuần này. Chờ tuần mới ⏳</div>`:
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${Object.entries(ACTS).map(([k,A])=>{const why=canAct(g,k);
      return `<button class="btn ${k==="rest"?"ghost":k==="show"?"lav":k==="concert"||k==="tour"?"gold":""}" style="text-align:left;padding:8px 10px" data-a="act" data-g="${g.id}" data-k="${k}" ${why?"disabled":""} title="${esc(why||A.desc)}">
      <div>${A.icon} ${A.name}</div><div style="font-size:11px;opacity:.9;font-weight:600">${why||(A.st?"−"+A.st+" thể lực":"")+(k==="single"?" · "+money(singleCost()):k==="concert"?" · "+money(concertCost()):k==="tour"?" · "+money(2e8):k==="fanmeet"?" · "+money(fmCost()):"")}</div></button>`}).join("")}</div>`}
  </div>`}).join("")}
  ${S.groups.length<lv().groups?`<div class="card stack"><h3>${ic("visual")} Debut nhóm mới</h3>
    ${free.length<2?`<div class="muted">Cần ít nhất 2 thực tập sinh chưa có nhóm. Hãy casting thêm!</div>`:`
    <div class="muted">Chọn 2–${MAX_MEMBERS} thành viên. Nhiều thành viên = sức mạnh cộng hưởng cao hơn.</div>
    <div class="row wrap" style="gap:6px">${free.map(id=>`<button class="chip ${ui.pick.includes(id)?"on":""}" data-a="pickM" data-id="${id}">${av(id,28)}${esc(BY[id].name)} <span class="rar r${BY[id].rar}">${BY[id].rar}</span></button>`).join("")}</div>
    <div class="row"><input type="text" id="gname" placeholder="Tên nhóm (để trống = ngẫu nhiên)" value="${esc(ui.gname)}" maxlength="24"><button class="btn ghost sm" data-a="randName">🎲</button></div>
    <button class="btn" data-a="debut" ${ui.pick.length<2?"disabled":""}>🎉 Debut ${ui.pick.length} thành viên · ${money(dcost)}</button>`}</div>`:`<div class="hint">Đã đủ số nhóm tối đa. Nâng cấp công ty ở 🏠 để debut thêm nhóm.</div>`}
  </div>`;
}
function viewCast(){
  const owned=own().length;
  return `<div class="stack"><div class="card center stack" style="background:linear-gradient(160deg,#fff0f7,#f2ecff)"><h2>${ic("letter")} Casting Idol</h2>
    <div>Bạn có <b>${S.tickets}</b> vé · Ký túc xá ${owned}/${lv().idols}</div>
    <div class="row" style="justify-content:center;flex-wrap:wrap">
      <button class="btn" data-a="pull" data-n="1" data-t="1" ${S.tickets<1?"disabled":""}>1 lượt · 1 vé</button>
      <button class="btn lav" data-a="pull" data-n="1" data-t="0">1 lượt · ${money(3e6)}</button>
      <button class="btn gold" data-a="pull" data-n="5" data-t="${S.tickets>=5?1:0}">5 lượt · ${S.tickets>=5?"5 vé":money(1.3e7)}<br><small>chắc chắn ≥ SR</small></button></div>
    <div class="muted">Tỉ lệ: <span class="rar rUR">UR</span> 4% · <span class="rar rSSR">SSR</span> 16% · <span class="rar rSR">SR</span> 35% · <span class="rar rR">R</span> 45%<br>
    Bảo hiểm: còn <b>${20-S.pity}</b> lượt chắc chắn SSR+ · Trùng idol → +1★ (tăng chỉ số & giới hạn)</div></div>
  <div class="card"><div class="row" style="margin-bottom:10px"><h3 class="sp">📖 Bộ sưu tập</h3><b class="num">${owned}/${ROSTER.length}</b></div>
    ${["UR","SSR","SR","R"].map(r=>`<div class="muted" style="margin:8px 0 6px"><span class="rar r${r}">${r}</span> <b class="num">${ROSTER.filter(x=>x.rar===r&&S.idols[x.id]).length}/${ROSTER.filter(x=>x.rar===r).length}</b></div><div class="grid6">${ROSTER.filter(x=>x.rar===r).map(x=>`<div class="dex">${av(x.id,56,!S.idols[x.id])}<span>${S.idols[x.id]?esc(x.name):"???"}</span></div>`).join("")}</div>`).join("")}
  </div></div>`;
}
function viewQuest(){
  const k=qlvOf(Math.min(S.claimed,MISSIONS.length-1)), a=QLV[k][0], e=qlvEnd(k), done=Math.min(S.claimed,e)-a, b=QLV[k][2];
  const list=MISSIONS.slice(S.claimed,Math.min(S.claimed+4,e));
  return `<div class="stack"><h2>${ic("target")} Nhiệm vụ</h2>
  <div class="card stack" style="gap:6px"><div class="row"><b class="sp">Level ${k+1}/${QLV.length} · ${QLV[k][1]}</b><span class="muted num">${done}/${e-a}</span></div>
    <div class="prog"><span style="width:${done/(e-a)*100}%"></span></div>
    <div class="muted" style="font-size:12px">Hoàn thành Level nhận thêm: ${b.money?money(b.money):""}${b.money&&b.tickets?" + ":""}${b.tickets?b.tickets+" vé casting":""}</div></div>
  ${list.length?list.map((m,i)=>{const ok=m[1](S);return `<div class="mission ${ok?"done":""}" style="${i?"opacity:.75":""}"><span style="font-size:22px">${ok?ic("gift"):i?"🔒":ic("star")}</span><div class="sp"><b>${m[0]}</b><div class="muted">Thưởng: ${m[2].money?money(m[2].money):""}${m[2].tickets?m[2].tickets+" vé casting":""}</div></div>${i===0?`<button class="btn sm ${ok?"":"ghost"}" data-a="claim" ${ok?"":"disabled"}>Nhận</button>`:""}</div>`}).join(""):`<div class="hint">👑 Bạn đã hoàn thành mọi nhiệm vụ. Huyền thoại!</div>`}
  <div class="muted center">Tiến độ chuỗi nhiệm vụ: ${S.claimed}/${MISSIONS.length}</div>
  <div class="card stack"><h3>📈 Thành tích</h3><div class="bars" style="grid-template-columns:1fr auto;font-size:14px">
    <span>Tuần đã điều hành</span><b class="num">${S.week-1}</b><span>Buổi luyện tập</span><b class="num">${S.st.trains}</b><span>Single phát hành</span><b class="num">${S.st.singles}</b>
    <span>Thứ hạng cao nhất</span><b class="num">${S.st.bestRank<999?"#"+S.st.bestRank:"–"}</b><span>Cúp #1</span><b class="num">${S.st.wins}</b><span>Concert / World Tour</span><b class="num">${S.st.concerts} / ${S.st.tours}</b>
    <span>Daesang</span><b class="num">${S.st.daesang}</b><span>Doanh thu nhạc số</span><b class="num">${money(S.st.earned)}</b></div></div>
  <div class="card stack"><h3>⚙️ Công ty</h3><div class="row"><input type="text" id="cname" value="${esc(S.company)}" maxlength="24"><button class="btn sm" data-a="rename">Đổi tên</button></div>
    <button class="btn ghost sm" data-a="askReset">Chơi lại từ đầu</button></div>
  <div class="muted center" style="font-size:12px">Hình idol là tranh minh hoạ fan-art phi thương mại. Game chỉ để giải trí cá nhân.</div></div>`;
}
function render(){
  document.getElementById("app").innerHTML=`<div class="top"><div class="res">
    <span class="pill m num"><b>${ic("money")}</b>${money(S.money)}</span><span class="pill f num"><b>${ic("fans")}</b>${fans(totalFans())}</span><span class="pill t num"><b>${ic("ticket")}</b>${S.tickets}</span><button class="pill w" data-a="cal" aria-label="Mở lịch trình"><b>${ic("s_cal")}</b>N${Math.floor((S.week-1)/52)+1} · T${((S.week-1)%52)+1}${S.sched.some(e=>!e.done&&e.day===absDay())?'<i class="dot"></i>':""}</button></div></div>`+
    ({home:viewHome,idols:viewIdols,groups:viewGroups,cast:viewCast,quest:viewQuest}[tab])();
  const claimable=MISSIONS[S.claimed]&&MISSIONS[S.claimed][1](S), idle=S.groups.some(g=>g.acted!==S.week);
  document.getElementById("tabs").innerHTML=TABS.map(([k,e,n])=>`<button class="${tab===k?"on":""}" data-a="tab" data-k="${k}"><span>${e}</span>${n}${(k==="quest"&&claimable)||(k==="groups"&&idle)||(k==="cast"&&S.tickets>0)?'<i class="dot"></i>':""}</button>`).join("");
  save();
}

/* ================== SỰ KIỆN CLICK ================== */
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-a]"); if(!t||t.disabled) return; const a=t.dataset.a, d=t.dataset;
  if(a==="bg"){if(e.target===t&&!modalLock)closeModal();return}
  if(a==="close") return closeModal();
  if(a==="tab"){tab=d.k;render();window.scrollTo(0,0);return}
  if(a==="rankInfo") return toast(ic("trophy")+" Điểm BXH = tổng fan + số cúp × 1000. Leo lên #1 để thành công ty số 1!");
  if(a==="clockInfo") return toast(ic("clock")+" Mỗi tuần kéo dài "+WEEK_MIN+" phút và tự sang tuần mới. Tắt game vẫn được tính bù!");
  if(a==="train"){const r=t.getBoundingClientRect(), b=S.idols[d.id][d.k], ok=train(d.id,d.k); render();
    if(ok)popAt(r.left+r.width/2-20,r.top-6,`${STATS.find(s=>s[0]===d.k)[3]} +${S.idols[d.id][d.k]-b}`);return}
  if(a==="replay") return replay(+d.g);
  if(a==="trainAll") return trainAll();
  if(a==="act") return act(+d.g,d.k);
  if(a==="pickM"){ui.gname=(document.getElementById("gname")||{}).value||ui.gname;ui.pick=ui.pick.includes(d.id)?ui.pick.filter(x=>x!==d.id):[...ui.pick,d.id].slice(0,MAX_MEMBERS);return render()}
  if(a==="randName"){ui.gname=pick(G1)+" "+pick(G2);return render()}
  if(a==="debut"){ui.gname=document.getElementById("gname").value;return debut()}
  if(a==="pull") return pull(+d.n,d.t==="1");
  if(a==="upgrade") return upgrade();
  if(a==="buy") return buy(d.k);
  if(a==="claim") return claim();
  if(a==="mgHit") return mgHit();
  if(a==="mgAuto"){if(mg){mg.hits=[1,1,1];finishShow(1.05)}return}
  if(a==="ev") return evPick(+d.i);
  if(a==="snd"){const on=Music.toggle();document.querySelectorAll("[data-a=snd]").forEach(b=>b.innerHTML=ic(on?"sound":"mute"));toast(on?ic("sound")+" Đã bật nhạc":ic("mute")+" Đã tắt nhạc");return}
  if(a==="pfSkip") return endPerform();
  if(a==="care") return openCare(d.id);
  if(a==="doCare") return doCare(d.id,d.k);
  if(a==="cal") return openCal();
  if(a==="calStk"){ui.stk=d.k;return openCal()}
  if(a==="calWho"){ui.who=d.k;return openCal()}
  if(a==="calDel"){S.sched=S.sched.filter(x=>x.id!==+d.id);render();return openCal()}
  if(a==="calDay") return placeSch(+d.d);
  if(a==="lsMake") return lsDesign(+d.g);
  if(a==="lsPick") return lsLaunch(+d.g,d.c);
  if(a==="rename"){const v=document.getElementById("cname").value.trim();if(v){S.company=v;toast("Đã đổi tên công ty");render()}return}
  if(a==="askDisband"){const g=S.groups.find(x=>x.id===+d.g);return modal(`<div class="stack center"><h3>Giải tán ${esc(g.name)}?</h3><div class="muted">Thành viên trở lại làm thực tập sinh, toàn bộ ${fans(g.fans)} fan sẽ mất.</div><div class="row"><button class="btn ghost sp" data-a="close">Huỷ</button><button class="btn sp" style="background:var(--red)" data-a="disband" data-g="${g.id}">Giải tán</button></div></div>`)}
  if(a==="disband") return disband(+d.g);
  if(a==="askReset") return modal(`<div class="stack center"><h3>Chơi lại từ đầu?</h3><div class="muted">Mọi tiến trình sẽ bị xoá.</div><div class="row"><button class="btn ghost sp" data-a="close">Huỷ</button><button class="btn sp" style="background:var(--red)" data-a="reset">Chơi lại</button></div></div>`);
  if(a==="reset"){try{localStorage.removeItem(KEY)}catch(e){}fresh();closeModal();tab="home";intro();render();return}
  if(a==="startGame"){const v=(document.getElementById("cname0")||{}).value;if(v&&v.trim())S.company=v.trim();S.seenIntro=true;S.weekStart=Date.now();closeModal();render();clock();daily();return}
});
document.addEventListener("keydown",e=>{if(mg&&(e.code==="Space"||e.code==="Enter")){e.preventDefault();mgHit()}});

/* ================== KHỞI ĐỘNG ================== */
function intro(){
  modal(`<div class="stack center"><div class="big">🐰 Idol Agency Tycoon</div>
    <div class="row" style="justify-content:center">${own().map(id=>av(id,60)).join("")}</div>
    <div>Bạn là CEO của một công ty giải trí nhỏ xíu, chỉ có phòng tập dưới tầng hầm và <b>3 thực tập sinh</b>.<br>Luyện tập → Debut → Ra nhạc → Thắng cúp → Mở rộng thành <b>Big 4</b>!</div>
    <input type="text" id="cname0" value="${esc(S.company)}" maxlength="24" aria-label="Tên công ty">
    <button class="btn" data-a="startGame">Thành lập công ty ✨</button></div>`,true);
}
const had=load();
render();
if(!had||!S.seenIntro) intro();
else{clock(); if(!document.querySelector(".modal")) daily()}
setInterval(clock,1000);
// mở khoá âm thanh ở lần chạm đầu tiên để sticker lịch tự chạy vẫn có nhạc
document.addEventListener("pointerdown",()=>Music.unlock(),{once:true});
// nhận quà điểm danh sau khi đóng popup offline
document.addEventListener("click",e=>{if(e.target.closest("[data-a=close]")&&S.daily!==today())setTimeout(daily,50)});
// Service worker: cho phép cài như app trên điện thoại và mở khi mất mạng (xem sw.js về scope "/quanlyidol")
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{scope:'/quanlyidol'}).catch(e=>console.warn('[sw] chưa đăng ký được:',e&&e.message))});
}
