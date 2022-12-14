# Kamoes

Pencarian kata dalam Kamus Besar Bahasa Indonesia yang lebih baik!

## Gol

> Menjadi mesin pencarian kata dalam Kamus Besar Bahasa Indonesia yang lebih baik!

## Fitur

- [ ] Pelengkap kata otomatis dan otokoreksi
- [ ] Filter kata berdasarkan:
  - [ ] Awalan (bawaan)
  - [ ] Akhiran
  - [ ] Huruf terakhir (Fase 2)
- [ ] Hasil Pencarian:
  - [ ] Makna
  - [ ] Kata Turunan (Fase 2)
  - [ ] Gabungan Kata (Fase 2)
  - [ ] Peribahasa (Fase 2)
  - [ ] Saran jika kata tidak ditemukan:
    - [ ] Kesamaan susunan huruf
    - [ ] Kesamaan makna (opsional)
- [ ] Histori kata yang dicari
  - [ ] LRU Cache(?)
- [ ] Progressive Web Application (PWA)
  - [ ] Berjalan secara lokal
- [ ] Pencarian berdasarkan kategori (opsional)
  - [ ] Kelas Kata
  - [ ] Ragam
  - [ ] Bahasa
  - [ ] Bidang
  - [ ] Jenis

## Task

### Pelengkap kata otomatis dan otokoreksi

#### Caveat

Ketika menggunakan SymSpell sebagai solusi untuk otokoreksi yang dijalankan di Web Worker, SymSpell memakan memori sebesar kurang lebih 500mb, ini merupakan angka yang sangat besar dibandingkan ketika hanya menggunakan Trie untuk pelengkap kata otomatis saja dengan memori sebesar 50mb. Hasil SymSpell cukup baik ketika digunakan untuk otokoreksi, namun ketika digunakan sebagai pelengkap kata, menurut saya hasilnya kurang memuaskan karena hasilnya lebih condong ke otokoreksi dibanding hasil prefiks

#### 1

- Cari kumpulan kata berdasarkan huruf yang dicari dalam struktur data Trie
- Didapatkan kumpulan kata terakhir. contoh: _ank_ -> _an_, *an*a, *an*i, *an*ak
- Bandingkan kata yang dicari dengan kumpulan kata yang ada menggunakan algoritma Damerau Levenshtein Distance
- Urutkan berdasarkan nilai distance

#### 2

- SymSpell
- References: https://wolfgarbe.medium.com/fast-approximate-string-matching-with-large-edit-distances-in-big-data-2015-9174a0968c0b

#### 3

- Use Trie first
- If error or not found, use SymSpell

#### 4

- Modify SymSpell to return autocomplete and correction

### Filter kata

- Asumsi: SymSpell mampu mendeteksi akhiran, namun sepertinya kurang cukup akurat

#### 1

- Buat data berdasarkan akhiran yang telah ada seperti an, in, kan, dsb. dan simpan dalam sebuah berkas JSON
- Masukkan data ke dalam SymSpell atau Trie untuk membuat kamus
- Jalankan SymSpell pada data yang ada
- Reset data jika pengguna mengubah filter kata dan gunakan data bawaan jika pengguna mengatur ulang filter kata
- Fase 2: Jika pengguna mengatur filter kata khusus, buat data baru berdasarkan masukan pengguna
