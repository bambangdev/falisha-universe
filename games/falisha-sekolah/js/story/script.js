/* Petualangan Falisha di MIMHa – naskah dialog NPC per langkah (murni: tidak mengubah state) */
const Script = (() => {
  const L = (who, text) => ({ who, text });
  const hint = (npc, st) => {
    const c = Quests.current(st);
    if (!c) return [L(npc, 'Hari ini seru sekali ya, Falisha!')];
    const name = { pupu: 'Ibu Pupu', baymax: 'Baymax', nono: 'Babah Nono', arsyad: 'Arsyad', guru: 'Bu Guru Aisyah', ustadz: 'Pak Ustadz Hasan',
      satpam: 'Pak Satpam', kantin: 'Bu Euis', putra: 'Putra', anasya: 'Anasya', ayana: 'Ayana', seyan: 'Seyan' };
    const chat = {
      pupu: 'Hati-hati ya, Nak.', baymax: 'Ayo semangat!', nono: 'Babah bangga sama Falisha!', arsyad: 'Kakak! Kakak!',
      guru: 'Semangat belajarnya, Falisha.', ustadz: 'Jangan lupa berdoa, ya.', satpam: 'Selamat pagi, Neng Falisha!',
      kantin: 'Jajanannya enak-enak lho.', putra: 'Halo Falisha!', anasya: 'Nanti kita main bareng ya!', ayana: 'Asyik, ada Falisha!', seyan: 'Kelas harus bersih!'
    };
    return [L(npc, chat[npc] || `Halo, aku ${name[npc]}.`), L('falisha', `Sekarang aku harus: ${c.text}.`)];
  };
  const T = {
    pupu: {
      pamit: () => ({ lines: [L('falisha', "Ibu, Falisha berangkat sekolah dulu. Assalamu'alaikum!"),
        L('pupu', "Wa'alaikumussalam. Ini bekalnya. Belajar yang rajin ya, Nak!"),
        L('pupu', 'Baymax sudah menunggu di jalan depan rumah.')], action: { type: 'complete', id: 'pamit' } }),
      siap: () => ({ lines: [L('pupu', 'Tas dan botol minumnya sudah dibawa, Nak?'), L('falisha', 'Belum, Bu. Aku ambil dulu: Ambil tas & botol minum.')], action: null })
    },
    baymax: {
      berangkat: () => ({ lines: [L('baymax', 'Ayo kita jalan ke MIMHa. Lewat trotoar ya!')], action: null })
    },
    satpam: {
      salam_guru: () => ({ lines: [L('satpam', 'Selamat pagi! Bu Guru Aisyah sudah menunggu di halaman.')], action: null })
    },
    guru: {
      salam_guru: () => ({ lines: [L('falisha', "Assalamu'alaikum, Bu Guru!"), L('guru', "Wa'alaikumussalam, Falisha. MasyaAllah, datang tepat waktu!"),
        L('guru', 'Sebelum belajar, kita wudhu dan shalat dhuha dulu di musala ya.')], action: { type: 'complete', id: 'salam_guru' } }),
      iqro: () => ({ lines: [L('guru', 'Ayo belajar huruf hijaiyah! Ketuk huruf yang Ibu sebut, ya.')], action: { type: 'minigame', id: 'iqro' } }),
      hitung: () => ({ lines: [L('guru', 'Sekarang berhitung pakai apel. Siap?')], action: { type: 'minigame', id: 'hitung' } }),
      doa: () => ({ lines: [L('guru', 'Sebelum istirahat, kita hafalan doa sebelum makan. Susun kata-katanya ya!')], action: { type: 'minigame', id: 'doa' } })
    },
    ustadz: {
      wudhu: () => ({ lines: [L('ustadz', 'Sebelum shalat kita wudhu dulu. Urutkan langkah wudhunya, ya!')], action: { type: 'minigame', id: 'wudhu' } }),
      dhuha: () => ({ lines: [L('ustadz', 'Bagus! Sekarang shalat dhuha berjamaah. Ikuti gerakan Bapak, ya.')], action: { type: 'minigame', id: 'dhuha' } })
    },
    kantin: {
      jajan: () => ({ lines: [L('kantin', 'Mau jajan apa, Neng? Bayarnya pakai uang pas ya!')], action: { type: 'minigame', id: 'jajan' } })
    },
    anasya: { lompat_tali: () => ({ lines: [L('anasya', 'Falisha, ayo main lompat tali!'), L('ayana', 'Lompat pas talinya di bawah kaki ya!')], action: { type: 'minigame', id: 'lompat_tali' } }) },
    ayana: { lompat_tali: () => ({ lines: [L('ayana', 'Ayo lompat tali bareng kami!')], action: { type: 'minigame', id: 'lompat_tali' } }) },
    putra: {
      pensil: st => {
        const n = Quests.count(st, 'pensil');
        if (n >= 5) return { lines: [L('falisha', 'Putra, ini 5 pensil warnamu!'), L('putra', 'Wah, lengkap! Terima kasih, Falisha. Jazakillah khairan!')],
          action: { type: 'give', item: 'pensil', n: 5, then: 'complete' } };
        return { lines: [L('putra', 'Pensil warnaku hilang 5... ada di kelas, halaman, lapangan, musala, dan kantin.'),
          L('putra', `Pensilnya masih kurang ${5 - n}.`)], action: null };
      }
    },
    seyan: {
      piket: () => ({ lines: [L('seyan', 'Ayo piket! Pungut sampah di kelas, halaman, dan lapangan, lalu buang ke tempat sampah.')], action: null })
    },
    nono: {
      pulang: () => ({ lines: [L('nono', 'Falisha! Babah jemput. Bagaimana sekolahnya hari ini?'), L('falisha', 'Seru sekali, Babah! Aku dapat banyak stiker bintang!'),
        L('arsyad', 'Kakak hebat!')], action: { type: 'complete', id: 'pulang' } })
    },
    arsyad: {
      pulang: () => ({ lines: [L('arsyad', 'Kakak! Ayo pulang sama Babah!'), L('nono', 'Ayo, Nak. Kita pulang.')], action: { type: 'complete', id: 'pulang' } })
    }
  };
  function talk(npc, st) {
    const c = Quests.current(st), f = c && T[npc] && T[npc][c.id];
    return f ? f(st) : { lines: hint(npc, st), action: null };
  }
  return { talk };
})();
if (typeof module === 'object' && module.exports) module.exports = Script;
