import React, { useState } from 'react';
import { 
  FileText, HelpCircle, Download, BookOpen, 
  ShoppingBag, Coins, Layers, User, ShieldAlert, 
  Settings, ChevronRight, Search, CheckCircle2, 
  Coffee, Wallet, FileSpreadsheet, ArrowLeftRight 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface TutorialModuleProps {
  currentUser: { name: string; role: string };
  onAddAuditLog: (action: string, module: string, details: string) => void;
  cafeName?: string;
}

interface Step {
  title: string;
  desc: string;
}

interface Chapter {
  id: string;
  title: string;
  icon: any;
  category: string;
  overview: string;
  steps: Step[];
  tips: string[];
}

export default function TutorialModule({
  currentUser,
  onAddAuditLog,
  cafeName = 'FIZQO CAFE'
}: TutorialModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapter, setActiveChapter] = useState<string>('pos');

  const chapters: Chapter[] = [
    {
      id: 'pos',
      title: 'POS Kasir (Point of Sale)',
      icon: ShoppingBag,
      category: 'Operasional Harian',
      overview: 'Modul POS digunakan oleh Kasir, Manager, dan Owner untuk memproses pesanan pelanggan, memilih meja, memberikan catatan kustom, serta menerima pembayaran real-time.',
      steps: [
        { title: '1. Memulai Pesanan (Pilih Meja/Pelanggan)', desc: 'Pada bagian kanan layar, masukkan nama Meja atau Pelanggan (misal: "Meja 05" atau "Rian"). Ini penting untuk mencocokkan pesanan saat disajikan.' },
        { title: '2. Memilih Produk & Detail Kustom', desc: 'Klik item menu yang ada di panel katalog sebelah kiri. Masukkan jumlah dan Anda bisa menambahkan "Catatan Kustom" (seperti "kurang manis", "es dipisah") untuk dapur.' },
        { title: '3. Memantau Ringkasan & Perhitungan Biaya', desc: 'Sistem otomatis menjumlahkan harga produk secara real-time, mengalkulasikan pajak (PPN), dan biaya pelayanan (Service Charge) sesuai konfigurasi sistem.' },
        { title: '4. Memproses Pembayaran & Cetak Struk', desc: 'Pilih metode pembayaran (Cash/Cani, QRIS, Debit BCA, dll), masukkan jumlah uang pembayaran, klik "Selesaikan Transaksi". Struk transaksi akan otomatis muncul lengkap dengan kalkulator kembalian.' }
      ],
      tips: [
        'Kasir dapat mencari menu dengan cepat di kotak pencarian POS.',
        'Struk POS dirancang bersih dan profesional, ramah untuk printer thermal 58mm/80mm.'
      ]
    },
    {
      id: 'cashflow',
      title: 'Manajemen Cashflow (Aliran Kas)',
      icon: Coins,
      category: 'Keuangan & Buku Kas',
      overview: 'Melacak seluruh aktivitas kas masuk dan keluar secara tersinkronisasi. Transaksi dari POS (Penjualan) serta Buku Pengeluaran akan otomatis tercatat di sini agar buku kas selalu akurat.',
      steps: [
        { title: '1. Sinkronisasi Penerimaan Sistem', desc: 'Setiap pembayaran pesanan yang sukses di POS akan otomatis dikreditkan sebagai "Uang Masuk [SALES]".' },
        { title: '2. Sinkronisasi Pengeluaran Operasional', desc: 'Registrasi biaya operasional (seperti beli es batu, bayar sampah, atau sewa) di modul "Pengeluaran" akan otomatis terdebet sebagai "Uang Keluar [EXPENSE]".' },
        { title: '3. Pencatatan Mutasi Manual', desc: 'Apabila ada modal awal kasir pagi (Starting Capital) atau setor tunai ke bank (Withdrawal), klik tombol "Catat Mutasi Kas Manual" di kanan atas.' },
        { title: '4. Memasang Filter & Analisis Periodik', desc: 'Gunakan filter tipe kas (Masuk/Keluar), kategori kas, metode pembayaran, atau rentang tanggal untuk melakukan audit cepat laci kasir.' }
      ],
      tips: [
        'Selalu catat modal awal laci kasir di pagi hari menggunakan kategori CAPITAL Rp 500.000 (default) agar pelacakan sisa uang fisik di laci sinkron dengan sistem.',
        'Saldo Kas Total Buku (All-time) mencerminkan sisa buku tunai keseluruhan di kafe.'
      ]
    },
    {
      id: 'expenses',
      title: 'Manajemen Pengeluaran (Buku Pengeluaran)',
      icon: Wallet,
      category: 'Keuangan & Buku Kas',
      overview: 'Pusat pencatatan biaya penunjang operasional kafe harian, mingguan, maupun bulanan agar laba bersih kafe terhitung dengan bersih.',
      steps: [
        { title: '1. Menginput Pengeluaran Baru', desc: 'Masuk ke menu "Pengeluaran", klik "Tambah Pengeluaran". Masukkan Nama Pengeluaran, Kategori (Bahan Baku, Utilitas, Operasional, Gaji, dll), besaran nominal, dan tanggal transaksi.' },
        { title: '2. Menghubungkan Pengeluaran dengan Kasir', desc: 'Catatan pengeluaran membutuhkan otorisasi operator perekam. Sistem mencatat siapa yang memasukkan data demi keamanan audit.' },
        { title: '3. Penghapusan Catatan Salah', desc: 'Jika ada kesalahan ketik, entri pengeluaran dapat dihapus, yang mana saldo Cashflow juga akan otomatis terkoreksi kembali.' }
      ],
      tips: [
        'Kelompokkan pengeluaran kulakan bahan baku dengan kategori "Bahan Baku" agar analisis profitabilitas di laporan laba rugi terpisah rapi dengan beban listrik/utilitas.'
      ]
    },
    {
      id: 'recipe',
      title: 'Resep BOM (Bill of Materials)',
      icon: BookOpen,
      category: 'Konfigurasi Produk',
      overview: 'Merupakan jembatan antara Menu Jual (Kopi Susu, Croissant) dengan Bahan Baku di gudang (Kopi Biji, Susu Cair, Gula Aren). Digunakan untuk menghitung HPP (Harga Pokok Penjualan) secara presisi.',
      steps: [
        { title: '1. Memilih Produk Jual', desc: 'Pilih salah satu produk di daftar sebelah kiri. Sistem akan memuat resep saat ini dan menunjukkan estimasi HPP terkini.' },
        { title: '2. Menyusun Komposisi Bahan', desc: 'Klik "Kelola Bahan Resep" atau pilih bahan baku dari gudang, tentukan takaran miligram (mg), mililiter (ml), atau pcs yang dibutuhkan untuk memproduksi 1 porsi menu.' },
        { title: '3. Kalkulasi HPP & Override Manual', desc: 'Sistem akan menjumlah harga bahan baku sesuai takaran untuk menghasilkan "HPP Akurat Sistem". Anda juga dapat memasukkan "HPP Manual (Override)" jika ingin mengunci margin tertentu.' }
      ],
      tips: [
        'Resep BOM yang dikonfigurasi dengan tepat akan memotong stok bahan baku di gudang secara otomatis setiap kali menu bersangkutan terjual di POS Kasir!'
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory & Stok Gudang',
      icon: Layers,
      category: 'Konfigurasi Produk',
      overview: 'Mengelola persediaan bahan mentah di gudang. Memiliki rekaman mutasi stok dan alert bawaan jika bahan baku kritis/hampir habis.',
      steps: [
        { title: '1. Membaca Alert Stok Kritis', desc: 'Sistem memberi sinyal kuning "Stok Kritis" jika stok bahan jatuh di bawah level batas minimum (Min Stock) yang ditentukan.' },
        { title: '2. Melakukan Stock Opname (Penyesuaian Manual)', desc: 'Klik icon pensil/edit pada bahan baku, masukkan jumlah stok fisik real terbaru. Berikan catatan penjelasan (misalnya: "Susu bocor", "Biji kopi tumpah", "Koreksi opname").' },
        { title: '3. Lacak Log Riwayat Pergerakan Stok', desc: 'Setiap pengurangan otomatis (akibat penjualan POS) maupun penyesuaian manual dicatat mendalam di tabel "Riwayat Pergerakan Stok".' }
      ],
      tips: [
        'Selalu periksa Stok Gudang sebelum jam ramai (peak hours) kafe dimulai untuk mencegah pesanan ditolak karena bahan baku habis di POS.'
      ]
    },
    {
      id: 'dashboard',
      title: 'Laporan Analitis & Laba Rugi',
      icon: FileSpreadsheet,
      category: 'Keuangan & Buku Kas',
      overview: 'Pusat kendali Owner dan Manager untuk memantau performa keuangan kafe, melacak laba bersih, dan merancang strategi menu.',
      steps: [
        { title: '1. Analitis Ringkasan Eksekutif (Bento Dashboard)', desc: 'Buka dashboard visual untuk melihat Pendapatan Kotor, Total Margin Laba Bersih, Rata-rata Nilai Belanja Pelanggan (Average Order Value), dan Porsi Pengeluaran.' },
        { title: '2. Laporan Laba Rugi Komprehensif', desc: 'Pada menu "Laporan", kaji Penjualan, HPP Kolektif (Cost of Goods Sold), Margin Laba Kotor, Operasional Beban, hingga Laba Bersih Bersih Operasional.' },
        { title: '3. Analisis Menu Terlaris (Pareto Product)', desc: 'Identifikasi produk yang memberikan margin terbesar atau kuantitas penjualan tertinggi untuk menyusun menu promo khusus.' }
      ],
      tips: [
        'Laporan laba rugi dapat difilter berdasarkan bulan berjalan atau kustom periode untuk rapat evaluasi bulanan kafe.'
      ]
    },
    {
      id: 'users',
      title: 'Manajemen Hak Akses User',
      icon: User,
      category: 'Sistem & Pengaturan',
      overview: 'Keamanan sistem bertingkat sesuai peran tugas karyawan. Mencegah penyalahgunaan diskon atau manipulasi data stok.',
      steps: [
        { title: '1. Mengenal Pembagian Peran', desc: 'Owner memegang kendali penuh (audit log, hapus data, kelola user). Manager mengelola stok, resep, pengeluaran & laporan. Cashier hanya beroperasi di POS Kasir dan Buku Pengeluaran.' },
        { title: '2. Cara Menambah Akun Staff Baru', desc: 'Masuk menu "Data User", masukkan Nama Lengkap, Email unik, Password standard, dan tentukan Role (Owner/Manager/Cashier). Klik "Tambah Akun Staff".' }
      ],
      tips: [
        'Instruksikan kasir untuk selalu logout jika giliran shift kerja (work shift) telah usai demi keakuratan pencatatan sisa kas.'
      ]
    },
    {
      id: 'audit',
      title: 'Audit Log & Keamanan Informasi',
      icon: ShieldAlert,
      category: 'Sistem & Pengaturan',
      overview: 'Tabel jejak aktivitas rahasia (Sistem Black Box) yang merekam setiap tindakan krusial di kafe.',
      steps: [
        { title: '1. Memeriksa Riwayat Aktivitas', desc: 'Setiap aksi penting seperti "Tambah Bahan Baku", "Hapus Mutasi Kas", "Ganti Harga", atau "Truncate Database" dicatat detail beserta tanggal waktu, detail aksi, nama user, dan modul terkait.' },
        { title: '2. Pencarian Jejak Masalah', desc: 'Jika terjadi selisih stok atau uang kasir, gunakan pencarian kata kunci user/modul di modul Audit Log untuk melacak kronologi kejadian sesungguhnya.' }
      ],
      tips: [
        'Audit log bersifat READ-ONLY dan tidak dapat dihapus atau dimodifikasi oleh siapa pun bahkan Owner sekalipun guna menjamin keaslian data (Tamper-proof).'
      ]
    },
    {
      id: 'settings',
      title: 'Pengaturan & Pajak Kafe',
      icon: Settings,
      category: 'Sistem & Pengaturan',
      overview: 'Konfigurasi branding struk fisik, besaran PPN, service charge, serta simulasi pembersihan database kasir.',
      steps: [
        { title: '1. Menyesuaikan Pajak & Biaya Layanan', desc: 'Masukkan persentase PPN (misal: 11% ditulis 0.11 atau 10% ditulis 0.1) dan Service Charge kafe Anda. Sistem akan langsung menaikkan perhitungan struk kasir secara real-time.' },
        { title: '2. Nama Kafe & Alamat Struk', desc: 'Sesuaikan Nama Kafe, Alamat Fisik Kafe, Nomor Telepon, dan Slogan/Footer Struk (contoh: "Terima Kasih, Datang Kembali!").' },
        { title: '3. Reset Database (Uji Coba)', desc: 'Gunakan tombol "Bersihkan Seluruh Transaksi" untuk menghapus data simulasi (pesanan, mutasi kas, pengeluaran) dan memulai pembukuan kafe baru yang bersih.' }
      ],
      tips: [
        'Gunakan fitur Reset Database dengan bijak karena tindakan ini tidak dapat dibatalkan (irreversible).'
      ]
    }
  ];

  // Filter of chapters based on search queries
  const filteredChapters = chapters.filter(chap => 
    chap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chap.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chap.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedChapterObj = chapters.find(c => c.id === activeChapter) || chapters[0];

  // PROGRAMMATIC EXPORT PDF GENERATION WITH JSPDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = '#123524'; // Elegance Dark Emerald
      const accentColor = '#4D7C0F';  // Deep Olive Lime

      let pageNum = 1;

      // HELPER: Write header on pages
      const applyPageHeader = (title: string) => {
        doc.setFillColor(18, 53, 36); // #123524
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(`BUKU PANDUAN PENGECOKAN & OPERASIONAL SISTEM - ${cafeName.toUpperCase()}`, 15, 9.5);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 195, 9.5, { align: 'right' });
      };

      // HELPER: Write footer
      const applyPageFooter = (current: number) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 282, 210, 15, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(0, 282, 210, 282);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Aplikasi Sistem Kasir & Keuangan Kafe Terintegrasi FIZQO v1.0', 15, 291);
        doc.text(`Halaman ${current}`, 195, 291, { align: 'right' });
      };

      // PAGE 1: COVER PAGE
      // Custom green elegant background shapes
      doc.setFillColor(18, 53, 36); // Dark Emerald
      doc.rect(0, 0, 210, 135, 'F');

      doc.setFillColor(77, 124, 15); // Olive Green Accent block
      doc.rect(15, 135, 180, 5, 'F');

      // Cover Logo block
      doc.setFillColor(255, 255, 255);
      doc.rect(20, 25, 18, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(18, 53, 36);
      doc.text('F', 24, 39);

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('BUKU PANDUAN PENGGUNA', 20, 68);
      doc.setFontSize(26);
      doc.text('FIZQO CAFE OS', 20, 80);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(173, 223, 173);
      doc.text('Sistem Operasional, Inventaris, Resep BOM, dan Manajemen Aliran Kas', 20, 92);

      // Metas bottom part of cover
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMASI DOKUMEN:', 20, 160);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nama Kafe        :  ${cafeName}`, 20, 172);
      doc.text(`Direkam Oleh     :  ${currentUser.name} (${currentUser.role.toUpperCase()})`, 20, 180);
      doc.text(`Tgl Penerbitan   :  ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`, 20, 188);
      doc.text('Status Dokumen   :  Resmi (Diunduh dari Panel Admin)', 20, 196);

      // Decorative warning card
      doc.setFillColor(241, 245, 249);
      doc.rect(20, 215, 170, 28, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(20, 215, 170, 28, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(18, 53, 36);
      doc.text('CATATAN KEAMANAN & PENGGUNAAN:', 25, 223);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      
      const disclaimer = 'Buku panduan ini merupakan dokumen internal kafe. Harap simpan dokumen ini secara rahasia untuk mencegah kebocoran alur stok gudang dan hak akses karyawan.';
      const disclaimerLines = doc.splitTextToSize(disclaimer, 160);
      doc.text(disclaimerLines, 25, 229.5);

      applyPageFooter(1);

      // PAGE 2 ONWARDS: CHAPTER CONTENT
      chapters.forEach((chap) => {
        pageNum++;
        doc.addPage();
        applyPageHeader(chap.title);

        // Header Title style
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(18, 53, 36);
        doc.text(`${chap.title}`, 15, 30);

        // Category Badge
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setFillColor(235, 241, 237);
        doc.rect(15, 33.5, doc.getTextWidth(chap.category) + 4, 4.5, 'F');
        doc.setTextColor(77, 124, 15);
        doc.text(chap.category, 17, 37);

        // Overview Paragraph
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        const overviewWrapped = doc.splitTextToSize(chap.overview, 180);
        doc.text(overviewWrapped, 15, 47);

        // Steps Title
        let yCoord = 65;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(18, 53, 36);
        doc.text('Langkah-Langkah Penggunaan Detail:', 15, yCoord);
        yCoord += 6;

        chap.steps.forEach((step) => {
          // Check pagination safety height before drawing step card
          if (yCoord > 240) {
            applyPageFooter(pageNum);
            pageNum++;
            doc.addPage();
            applyPageHeader(chap.title);
            yCoord = 30;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          doc.text(step.title, 18, yCoord);
          yCoord += 4.5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          const descWrapped = doc.splitTextToSize(step.desc, 172);
          doc.text(descWrapped, 22, yCoord);
          yCoord += (descWrapped.length * 4) + 5;
        });

        // Safe space for Tips section
        if (yCoord > 220) {
          applyPageFooter(pageNum);
          pageNum++;
          doc.addPage();
          applyPageHeader(chap.title);
          yCoord = 30;
        }

        // Draw Tips Card
        doc.setFillColor(244, 247, 245);
        doc.rect(15, yCoord, 180, 28, 'F');
        doc.setDrawColor(18, 53, 36);
        // Border left line only for aesthetic
        doc.line(15, yCoord, 15, yCoord + 28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(18, 53, 36);
        doc.text('💡 TIPS SUKSES & TRIK:', 20, yCoord + 6.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        let tipText = '';
        chap.tips.forEach((tip, idx) => {
          tipText += `• ${tip}\n`;
        });
        const tipsWrapped = doc.splitTextToSize(tipText.trim(), 170);
        doc.text(tipsWrapped, 20, yCoord + 12);

        applyPageFooter(pageNum);
      });

      // Saving document
      doc.save(`Fizqo_Panduan_Operasional_${cafeName.replace(/\s+/g, '_')}.pdf`);
      
      onAddAuditLog(
        'Export Guide PDF',
        'System Settings',
        `Generated user operating guide pdf and saved local file. Operator: ${currentUser.name}`
      );
      alert('✅ Berhasil menggenerate dokumen PDF! File "Fizqo_Panduan_Operasional_..." akan segera didownload secara otomatis oleh browser Anda.');
    } catch (err: any) {
      console.error(err);
      alert('⚠️ Gagal membuat PDF: ' + err.message);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto font-sans">
      
      {/* Top Welcome Title Grid */}
      <div className="bg-gradient-to-r from-[#123524] to-[#1C3E2F] p-6 rounded-3xl text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 bottom-0 translate-y-12 translate-x-12 opacity-10 blur-xl w-72 h-72 rounded-full bg-[#85A947]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#85A947]/20 border border-[#85A947]/30 text-[#ADDFAD] rounded-full text-[10px] uppercase tracking-widest font-black leading-none">
              <CheckCircle2 className="h-3 w-3" />
              <span>Pusat Informasi & Operasi</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase leading-tight">Buku Panduan & Tutorial Pengguna</h2>
            <p className="text-xs text-slate-250 font-medium max-w-2xl leading-normal">
              Selamat datang di pusat edukasi operasional kafe Anda. Halaman ini menjelaskan secara menyeluruh cara kerja, alur transaksi, hingga detail kontrol stok gudang demi kesuksesan outlet dan pembukuan Anda.
            </p>
          </div>

          <button
            id="download-tutorial-pdf-btn"
            type="button"
            onClick={handleExportPDF}
            className="self-start md:self-center bg-[#85A947] hover:bg-[#96bd56] text-[#123524] hover:shadow-lg hover:scale-103 font-black text-xs uppercase tracking-wider py-3 px-5 rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer outline-none shadow-sm"
          >
            <Download className="h-4.5 w-4.5" />
            <span>Download Panduan PDF</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Index Chapters list, Right Content viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Chapter Navigation Index */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3.5">
            <div>
              <span className="text-[9px] text-[#4D7C0F] font-black uppercase tracking-widest leading-none">Cari Topik Bantuan</span>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="query-help-center"
                  type="text"
                  placeholder="Ketik kata kunci (misal: stok, resep, hpp)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.8 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:border-[#85A947] transition-colors"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-1">
              <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-widest pl-2 mb-2 leading-none">Daftar Bab Panduan</span>
              
              {filteredChapters.map((chap) => {
                const Icon = chap.icon;
                const isSelected = activeChapter === chap.id;

                return (
                  <button
                    id={`btn-chapter-nav-${chap.id}`}
                    key={chap.id}
                    type="button"
                    onClick={() => setActiveChapter(chap.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-50 border-[#85A947] text-[#123524] shadow-xs'
                        : 'bg-white border-transparent text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-[#EBF1ED] border-[#85A947]/30 text-[#4D7C0F]' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate leading-tight ${isSelected ? 'text-[#123524]' : 'text-slate-800'}`}>{chap.title}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{chap.category}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'text-[#85A947] translate-x-1' : 'text-slate-350'}`} />
                  </button>
                );
              })}

              {filteredChapters.length === 0 && (
                <p className="text-center text-xs text-slate-400 font-black p-4">Tidak ada bab yang cocok dengan pencarian Anda.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Primary View Chapter details */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-sans font-black text-xs text-[#123524] tracking-wide uppercase">Tampilan Detail Penggunaan</span>
            <div className="inline-flex gap-1 items-center bg-[#123524]/5 text-[#123524] px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
              {selectedChapterObj.category}
            </div>
          </div>

          <div className="p-5 md:p-6 space-y-6">
            
            {/* Header / Intro section inside card viewpoint */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#EBF1ED] rounded-xl border border-[#85A947]/30 text-[#4D7C0F]">
                  <selectedChapterObj.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#123524] uppercase tracking-wide leading-tight">{selectedChapterObj.title}</h3>
                  <p className="text-[10px] text-slate-405 font-bold uppercase tracking-wider mt-0.5">Ringkasan Fungsi & Fitur</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 border border-slate-201/50 p-3.5 rounded-xl">
                {selectedChapterObj.overview}
              </p>
            </div>

            {/* Steps Container list */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#85A947]" />
                Langkah-Langkah Implementasi & Operasi:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedChapterObj.steps.map((st, sidx) => (
                  <div key={sidx} className="p-4 bg-white border border-slate-205 rounded-xl hover:border-emerald-600 transition shadow-xs flex flex-col space-y-1.5 justify-start">
                    <span className="text-[10.5px] font-bold text-[#123524] uppercase tracking-wide font-mono flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#85A947]" />
                      {st.title.split('. ')[0]}. {st.title.split('. ')[1] || st.title}
                    </span>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Banner Card block footer */}
            <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-xl space-y-2">
              <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-base leading-none">💡</span>
                Tips & Rekomendasi Penting
              </h5>
              <ul className="list-disc list-inside space-y-1.8 pl-1">
                {selectedChapterObj.tips.map((tip, tidx) => (
                  <li key={tidx} className="text-xs text-amber-900 font-semibold leading-relaxed pl-1">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
