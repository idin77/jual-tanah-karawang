/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type FormEvent, useEffect, useRef, useState } from 'react';

const NAV_ITEMS = [
  { href: '#beranda', label: 'Beranda' },
  { href: '#tentang', label: 'Tentang Kami' },
  { href: '#keunggulan', label: 'Keunggulan Kami' },
  { href: '#potensi', label: 'Potensi Pengembangan' },
  { href: '#galeri', label: 'Galeri' },
  { href: '#lokasi', label: 'Lokasi & Akses' },
  { href: '#testimoni', label: 'Testimoni' },
  { href: '#kontak', label: 'Kontak' },
] as const;

interface InquiryErrors {
  name?: string;
  email?: string;
  phone?: string;
}

interface SubmittedInquiry {
  name: string;
  email: string;
  phone: string;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'legalitas-shm',
    category: 'Legalitas Tanah',
    question: 'Apakah legalitas sertifikat tanah 4 hektare ini sudah jelas dan bebas sengketa?',
    answer:
      'Ya. Lahan seluas 4 hektare (40.000 m²) ini memiliki Sertifikat Hak Milik (SHM) yang sah, berstatus tanah darat siap bangun, dan bebas dari sengketa. Tim Mitra Property Indonesia siap mendampingi calon pembeli untuk melakukan pengecekan keabsahan sertifikat langsung bersama Notaris/PPAT dan BPN sebelum transaksi berlangsung.',
  },
  {
    id: 'legalitas-zona',
    category: 'Legalitas Tanah',
    question: 'Apa status zona tata ruang lahan ini dan peruntukan apa saja yang diizinkan?',
    answer:
      'Lahan berada di Zona Kuning (Area Komersial & Residential) tepat di tepi Jalan Raya Telukjambe dengan akses Jalan Kabupaten Ring 1. Peruntukan ini mendukung berbagai pengembangan seperti townhouse, pergudangan/logistik, rumah sakit, universitas, perkantoran, hingga kawasan komersial.',
  },
  {
    id: 'pembayaran-mekanisme',
    category: 'Mekanisme Pembayaran',
    question: 'Bagaimana mekanisme pembayaran dan apakah harga Rp 100 Milyard masih bisa nego?',
    answer:
      'Harga penawaran Rp 100 Milyard bersifat fleksibel (nego) bagi calon pembeli atau investor serius setelah melakukan survei lokasi. Mekanisme transaksi dilakukan secara transparan melalui tanda jadi (booking fee), uang muka (DP), hingga pelunasan dan penandatanganan Akta Jual Beli (AJB) di hadapan Notaris/PPAT resmi.',
  },
  {
    id: 'pembayaran-skema',
    category: 'Mekanisme Pembayaran',
    question: 'Apakah tersedia opsi termin pembayaran bertahap untuk transaksi korporasi?',
    answer:
      'Kami terbuka mendiskusikan skema pembayaran bertahap maupun termin sesuai kesepakatan antara pemilik lahan dan pihak pembeli/korporasi, dengan seluruh kesepakatan dituangkan secara resmi dalam PPJB Notaris agar aman bagi kedua belah pihak.',
  },
  {
    id: 'survei-jadwal',
    category: 'Proses Survei',
    question: 'Bagaimana cara menjadwalkan survei langsung ke lokasi di Telukjambe, Karawang?',
    answer:
      'Anda dapat mengajukan jadwal survei melalui formulir pada bagian Kontak di atas atau menghubungi langsung tim pemasaran kami via WhatsApp di 0857 8106 8441. Tim kami akan mendampingi penuh saat peninjauan batas lahan, kondisi kontur tanah, dan akses jalan di lapangan.',
  },
  {
    id: 'survei-dokumen',
    category: 'Proses Survei',
    question: 'Pendampingan dan data apa saja yang diberikan selama proses survei dan uji tuntas?',
    answer:
      'Saat kunjungan lokasi, tim kami menyediakan informasi koordinat batas lahan, akses fasilitas sekitar, serta data awal legalitas. Untuk pembeli yang melanjutkan ke tahap keseriusan (LOI), kami memfasilitasi pengukuran ulang luas lahan serta verifikasi dokumen SHM bersama Notaris/PPAT pilihan Anda.',
  },
];

export default function App() {
  const [activeNav, setActiveNav] = useState<string>('#beranda');
  const [openFaqId, setOpenFaqId] = useState<string>(FAQ_ITEMS[0].id);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [submittedInquiry, setSubmittedInquiry] = useState<SubmittedInquiry | null>(null);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const shareRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!shareOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShareOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shareOpen]);

  useEffect(() => {
    if (!linkCopied) return;
    const timer = window.setTimeout(() => setLinkCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [linkCopied]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://jualtanahkarawang.web.id/';
  const shareText =
    'Jual Tanah Strategis 4 Hektare (40.000 m²) SHM Zona Kuning di Jl. Raya Telukjambe, Karawang — Mitra Property Indonesia:';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = shareUrl;
        tempInput.setAttribute('readonly', '');
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setLinkCopied(true);
    } catch {
      const tempInput = document.createElement('textarea');
      tempInput.value = shareUrl;
      tempInput.setAttribute('readonly', '');
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setLinkCopied(true);
    }
  };

  const handleInquirySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const nextErrors: InquiryErrors = {};

    if (trimmedName.length < 2) {
      nextErrors.name = 'Masukkan nama lengkap Anda.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Masukkan alamat email yang valid.';
    }
    const digitCount = trimmedPhone.replace(/\D/g, '').length;
    if (digitCount < 9 || digitCount > 16) {
      nextErrors.phone = 'Masukkan nomor telepon / WhatsApp yang valid.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmittedInquiry({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
    });
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleResetInquiry = () => {
    setSubmittedInquiry(null);
    setErrors({});
  };

  return (
    <>
      <svg width="0" height="0" className="svg-sprite" aria-hidden="true">
        <defs>
          <symbol id="i-check" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="currentColor" />
            <path
              d="M6.8 12.6l3.3 3.3 7-7.6"
              fill="none"
              stroke="#fff"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </symbol>
          <symbol id="i-pin" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 1.8c-4.1 0-7.4 3.3-7.4 7.4 0 5.5 6.4 11.6 6.8 12 .3.3.9.3 1.2 0 .4-.4 6.8-6.5 6.8-12 0-4.1-3.3-7.4-7.4-7.4z"
            />
            <circle cx="12" cy="9.2" r="3" fill="#fff" />
          </symbol>
          <symbol id="i-arrow" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path
              d="M7.6 12h8m-3.2-3.4L16 12l-3.6 3.4"
              fill="none"
              stroke="#fff"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </symbol>
          <symbol id="i-shield" viewBox="0 0 48 48">
            <path d="M24 3l16 6v12c0 10.6-6.8 18.8-16 22-9.2-3.2-16-11.4-16-22V9l16-6z" fill="#0E3A78" />
            <path
              d="M15.5 23.5l6 6L33 18.5"
              fill="none"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="35.5" cy="36.5" r="7.5" fill="#F5B921" />
            <circle cx="35.5" cy="36.5" r="4.2" fill="none" stroke="#0E3A78" strokeWidth="2.4" />
            <path d="M38.6 39.6l4 4" stroke="#0E3A78" strokeWidth="2.4" strokeLinecap="round" />
          </symbol>
          <symbol id="i-sprout" viewBox="0 0 48 48">
            <path d="M24 41V21" stroke="#0E3A78" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M23 25c.2-7.2-4.8-12.4-12.2-12.6.4 7.4 5.2 12.4 12.2 12.6z" fill="#0E3A78" />
            <path d="M25 21c-.2-6.4 4-10.8 10.6-11-.4 6.6-4.4 10.9-10.6 11z" fill="#2C6CB0" />
            <path d="M9 40.5c4.5-2.6 25.5-2.6 30 0-4.5 3.3-25.5 3.3-30 0z" fill="#F5B921" />
          </symbol>
          <symbol id="i-zmap" viewBox="0 0 48 48">
            <path
              d="M5 16.5l12.5-5 13 5 12.5-5v21.5l-12.5 5-13-5-12.5 5V16.5z"
              fill="none"
              stroke="#2C6CB0"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M30 4.5c-4.5 0-8.2 3.5-8.2 7.9 0 5.7 6.6 12.1 7.6 13 .3.3.9.3 1.2 0 1-.9 7.6-7.3 7.6-13 0-4.4-3.7-7.9-8.2-7.9z"
              fill="#0E3A78"
            />
            <circle cx="30" cy="12.4" r="3.1" fill="#F5B921" />
          </symbol>
          <symbol id="i-road" viewBox="0 0 48 48">
            <path d="M20 4h8l16 40H4L20 4z" fill="#0E3A78" />
            <path
              d="M24 9v31"
              stroke="#fff"
              strokeWidth="3.4"
              strokeDasharray="6.2 5.2"
              strokeLinecap="round"
            />
            <path d="M18.6 5L4.5 44M29.4 5l14.1 39" stroke="#F5B921" strokeWidth="3.2" strokeLinecap="round" />
          </symbol>
          <symbol id="i-phone" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M6.7 2.9c.5 0 1 .3 1.2.8l1.6 3.3c.2.5.1 1.1-.3 1.5L7.7 10a15 15 0 006.4 6.4l1.5-1.5c.4-.4 1-.5 1.5-.3l3.3 1.6c.5.2.8.7.8 1.2v3.1c0 .9-.7 1.6-1.6 1.6C10.7 22.1 1.9 13.3 1.9 4.5c0-.9.7-1.6 1.6-1.6h3.2z"
            />
          </symbol>
          <symbol id="i-wa" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a11.49 11.49 0 01-5.858-1.604l-.42-.25-4.336 1.137 1.16-4.23-.273-.274A11.45 11.45 0 011.985 12c0-6.326 5.15-11.474 11.482-11.474 3.066 0 5.947 1.195 8.11 3.36a11.38 11.38 0 013.362 8.115c-.004 6.326-5.153 11.474-11.483 11.474m9.757-21.23C19.607 2.46 16.55.995 13.244.995 6.478.995.965 6.508.965 13.272c0 2.11.55 4.172 1.598 5.99L0 24l4.865-1.59a11.44 11.44 0 005.379 1.37h.004c6.764 0 12.277-5.512 12.277-12.277 0-3.28-1.276-6.363-3.595-8.681-2.318-2.318-5.4-3.596-8.68-3.596z"
            />
          </symbol>
          <symbol id="i-fb" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </symbol>
          <symbol id="i-yt" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.121 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
            />
          </symbol>
          <symbol id="i-ig" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
            />
          </symbol>
          <symbol id="i-x" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.99-6.932zM17.61 20.644h2.039L6.486 3.24H4.298l13.312 17.404z"
            />
          </symbol>
          <symbol id="i-factory" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22 21H2V8.8l6 3.6V7l6 3.6V5.6L22 9.2V21zM5 14h2.5v2.5H5V14zm5.5 0H13v2.5h-2.5V14zm5.5 0h2.5v2.5H16V14z"
            />
          </symbol>
          <symbol id="i-bag" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M7.5 8V6a4.5 4.5 0 019 0v2h3.2l1.1 14H3.2L4.3 8h3.2zm2 0h5V6a2.5 2.5 0 00-5 0v2z"
            />
          </symbol>
          <symbol id="i-city" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M3 21V7h7v14h4V3h7v18H3zm4-11h2v2H7v-2zm0 4h2v2H7v-2zm8-7h3v2h-3V7zm0 4h3v2h-3v-2zm0 4h3v2h-3v-2z"
            />
          </symbol>
          <symbol id="i-cap" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 4L1 9l11 5 9-4.1V16h2V9L12 4zM5.5 13.6V17c0 1.66 2.91 3 6.5 3s6.5-1.34 6.5-3v-3.4L12 16.8l-6.5-3.2z"
            />
          </symbol>
          <symbol id="i-wh" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21 21H3V9.4L12 4l9 5.4V21zm-15-9h12v2H6v-2zm0 4h12v2H6v-2z"
            />
          </symbol>
          <symbol id="i-fuel" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16h-2.5v-9H6.5v9H4zm2.5-13h5V5.5h-5V8zm12.8 1.9l1.7 1.7V19a2 2 0 11-4 0v-4h-1.5l1.6-6.3c.3-1 1.3-1.6 2.2-.8z"
            />
          </symbol>
          <symbol id="i-chev" viewBox="0 0 24 24">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </symbol>
          <symbol id="i-star" viewBox="0 0 24 24">
            <path d="M12 1.9l3.2 6.5 7.1 1-5.1 5 1.2 7.1L12 18.1l-6.4 3.4 1.2-7.1-5.1-5 7.1-1z" fill="currentColor" />
          </symbol>
          <symbol id="i-share" viewBox="0 0 24 24">
            <circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </symbol>
          <symbol id="i-link" viewBox="0 0 24 24">
            <path
              d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </symbol>
          <symbol id="i-close" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </symbol>
        </defs>
      </svg>

      <header className="topbar">
        <div className="wrap bar-in">
          <a
            className="brand"
            href="#beranda"
            aria-label="Mitra Property Indonesia - Beranda"
            onClick={() => setActiveNav('#beranda')}
          >
            <img src="/images/img-1.jpg" alt="Logo Mitra Property Indonesia" width={317} height={94} />
          </a>
          <nav className="nav" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                className={activeNav === item.href ? 'active' : undefined}
                href={item.href}
                onClick={() => setActiveNav(item.href)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            className="btn-wa"
            href="https://wa.me/6285781068441?text=Halo%20Mitra%20Property%20Indonesia%2C%20saya%20ingin%20bertanya%20tentang%20Tanah%20Strategis%204%20Hektare%20di%20Jl.%20Raya%20Telukjambe%20Karawang"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="ic">
              <use href="#i-wa" />
            </svg>
            Hubungi Kami
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="beranda">
          <svg
            className="sw"
            viewBox="0 0 1215 390"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="gsw" x1="0" y1="0" x2=".7" y2="1">
                <stop offset="0" stopColor="#FFE98C" />
                <stop offset=".55" stopColor="#FFD409" />
                <stop offset="1" stopColor="#E9A81B" />
              </linearGradient>
            </defs>
            <path
              fill="url(#gsw)"
              d="M465 0 C478 8 494 18 498 32 C495 60 494 100 495 140 C496 170 498 185 500 202 L502 208 L507 206 C505 175 504 140 505 110 C506 80 511 50 521 18 L524 0 Z"
            />
            <path
              fill="url(#gsw)"
              d="M284 325 C345 329 425 345 478 366 C495 373 505 380 510 388 L511 390 L474 390 C468 381 452 372 430 363 C390 347 330 336 284 330 Z"
            />
          </svg>
          <div className="hero-in">
            <div className="hero-txt">
              <h1>
                <span className="l1">Jual Tanah Strategis</span>
                <span className="l2">4 Hektare Karawang</span>
                <span className="l3">40.000 m&sup2;</span>
              </h1>
              <p className="loc">
                <svg className="ic">
                  <use href="#i-pin" />
                </svg>
                <span>
                  di Jalan Raya Telukjambe
                  <br />
                  Kabupaten Karawang
                </span>
              </p>
              <p className="sub">
                Investasi tanah Karawang terbaik untuk masa depan
                <br />
                bisnis dan properti Anda
              </p>
              <a className="btn-gold" href="#tentang" onClick={() => setActiveNav('#tentang')}>
                <svg className="ic">
                  <use href="#i-arrow" />
                </svg>
                Lihat Detail Properti
              </a>
            </div>
            <figure className="hero-img">
              <img
                src="/images/img-2.webp"
                fetchPriority="high"
                alt="Foto drone udara lahan tanah strategis 4 hektare di Jl. Raya Telukjambe Karawang — lahan hijau di tengah, jalan raya dan kawasan sekitar"
                width={1264}
                height={842}
              />
            </figure>
          </div>
        </section>

        <section className="feat-sec">
          <div className="edge-gold" />
          <div className="wrap">
            <div className="feat-card">
              <div className="feat">
                <svg className="fic">
                  <use href="#i-shield" />
                </svg>
                <div>
                  <b>
                    Sertifikat
                    <br />
                    SHM
                  </b>
                </div>
              </div>
              <div className="feat">
                <svg className="fic">
                  <use href="#i-sprout" />
                </svg>
                <div>
                  <b>
                    Status
                    <br />
                    Tanah Darat
                  </b>
                </div>
              </div>
              <div className="feat">
                <svg className="fic">
                  <use href="#i-zmap" />
                </svg>
                <div>
                  <b>Zona Kuning</b>
                  <small>Area Komersial &amp; Residential</small>
                </div>
              </div>
              <div className="feat">
                <svg className="fic">
                  <use href="#i-road" />
                </svg>
                <div>
                  <b>
                    Akses Jalan
                    <br />
                    Kabupaten Ring 1
                  </b>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap two">
          <article className="card" id="tentang">
            <h2 className="head">Informasi Properti</h2>
            <div className="card-b">
              <div className="luas">
                <span className="luas-ic">
                  <svg className="ic">
                    <use href="#i-zmap" />
                  </svg>
                </span>
                <div>
                  <small>Luas Tanah</small>
                  <strong>4 Hektare</strong>
                  <span>(40.000 m&sup2;)</span>
                </div>
              </div>
              <ul className="chk blue">
                <li>
                  <svg className="ic">
                    <use href="#i-check" />
                  </svg>
                  Sertifikat : SHM
                </li>
                <li>
                  <svg className="ic">
                    <use href="#i-check" />
                  </svg>
                  Status : Tanah Darat
                </li>
                <li>
                  <svg className="ic">
                    <use href="#i-check" />
                  </svg>
                  Zona : Kuning
                </li>
                <li>
                  <svg className="ic">
                    <use href="#i-check" />
                  </svg>
                  Lokasi : Jl. Raya Telukjambe Kab. Karawang
                </li>
              </ul>
              <p>
                Jual tanah 4 hektare Karawang bersertifikat SHM &#8212; tanah SHM dijual dengan status tanah darat
                siap bangun di lokasi paling strategis di jantung Karawang. Dengan luas 40.000 m&sup2;, lahan ini
                cocok untuk berbagai pengembangan usaha sekaligus peluang investasi tanah Karawang jangka panjang
                yang menjanjikan.
              </p>
            </div>
          </article>

          <article className="card" id="potensi">
            <h2 className="head">Potensi Pengembangan</h2>
            <div className="card-b tiles">
              <figure className="tile">
                <img src="/images/img-3.jpg" alt="Townhouse" width={192} height={94} />
                <figcaption>Townhouse</figcaption>
              </figure>
              <figure className="tile">
                <img src="/images/img-4.jpg" alt="Gudang / Logistik" width={199} height={94} />
                <figcaption>Gudang / Logistik</figcaption>
              </figure>
              <figure className="tile">
                <img src="/images/img-5.jpg" alt="Rumah Sakit" width={180} height={94} />
                <figcaption>Rumah Sakit</figcaption>
              </figure>
              <div className="row2">
                <figure className="tile">
                  <img src="/images/img-6.jpg" alt="Universitas" width={295} height={81} />
                  <figcaption>Universitas</figcaption>
                </figure>
                <figure className="tile">
                  <img src="/images/img-7.jpg" alt="Area Komersial" width={287} height={81} />
                  <figcaption>Area Komersial</figcaption>
                </figure>
              </div>
              <p>
                Bagi pencari tanah komersial dijual Karawang, status zona kuning pada lahan ini membuka peluang
                townhouse, gudang/logistik, rumah sakit, hingga universitas. Lokasi yang berdampingan dengan kawasan
                industri juga membuatnya diminati pencari tanah industri dijual Karawang untuk kebutuhan pergudangan
                dan kantor operasional.
              </p>
            </div>
          </article>
        </section>

        <section className="wrap gal-sec" id="galeri">
          <article className="card">
            <h2 className="head">Galeri Foto &amp; Video Properti</h2>
            <div className="card-b">
              <div className="video-row">
                <div className="vwrap">
                  <video
                    controls
                    preload="metadata"
                    playsInline
                    poster="https://jualtanahkarawang.web.id/thumbnail-lahan.webp"
                    src="https://jualtanahkarawang.web.id/video-lahan.mp4"
                    aria-label="Video tur lahan 4 hektare Telukjambe Karawang"
                  />
                  <span className="vchip">&#9654; Video &#8226; 29 detik</span>
                </div>
                <div className="vinfo">
                  <h3>Video Survey Lahan 4 Hektare</h3>
                  <p>
                    Tur singkat mengelilingi areal properti &#8212; mulai dari halaman dan bangunan pendukung, taman,
                    hingga kondisi lahan yang subur dan siap bangun. Lihat langsung kondisi aktual tanah 4 hektare ini
                    sebelum survei lokasi.
                  </p>
                  <span className="hint">
                    <svg className="ic">
                      <use href="#i-arrow" />
                    </svg>
                    Tekan tombol play &#8212; video dimuat langsung dari lokasi
                  </span>
                </div>
              </div>
              <div className="gal-grid">
                <figure className="gphoto">
                  <img
                    src="/images/img-8.webp"
                    alt="Lahan tanah darat hijau seluas 4 hektare di Telukjambe Karawang"
                  />
                  <figcaption>Lahan Tanah Darat Subur</figcaption>
                </figure>
                <figure className="gphoto">
                  <img src="/images/img-9.webp" alt="Kondisi lahan subur siap bangun di Telukjambe Karawang" />
                  <figcaption>Lahan Siap Bangun</figcaption>
                </figure>
                <figure className="gphoto">
                  <img
                    src="/images/img-10.webp"
                    alt="Halaman dan bangunan pendukung pada lahan 4 hektare Telukjambe Karawang"
                  />
                  <figcaption>Halaman &amp; Bangunan Pendukung</figcaption>
                </figure>
                <figure className="gphoto">
                  <img
                    src="/images/img-11.webp"
                    alt="Taman dan halaman luas pada areal properti Telukjambe Karawang"
                  />
                  <figcaption>Taman &amp; Halaman Luas</figcaption>
                </figure>
                <figure className="gphoto">
                  <img
                    src="/images/img-12.webp"
                    alt="Depan lahan menghadap Jl. Raya Telukjambe dengan ruko dan atribut jalan"
                  />
                  <figcaption>Menghadap Jl. Raya Telukjambe</figcaption>
                </figure>
                <figure className="gphoto">
                  <img
                    src="/images/img-13.webp"
                    alt="Suasana Jl. Raya Telukjambe di depan lahan, ramai lalu lintas"
                  />
                  <figcaption>Suasana Jalan Raya Depan</figcaption>
                </figure>
              </div>
            </div>
          </article>
        </section>

        <section className="wrap loc-sec" id="lokasi">
          <article className="card">
            <h2 className="head">Lokasi &amp; Akses Strategis</h2>
            <div className="card-b">
              <p className="loc-intro">
                Tanah dijual di Telukjambe Karawang ini berada tepat di Jalan Raya Telukjambe &#8212; jalur utama
                yang menghubungkan pusat kota Karawang, kawasan industri, dan pintu tol. Semua kebutuhan bisnis,
                pendidikan, logistik, hingga pengisian bahan bakar berada dalam radius berjalan kaki sampai beberapa
                menit berkendara.
              </p>
              <div className="loc-grid">
                <div className="lcard">
                  <span className="lic">
                    <svg className="ic">
                      <use href="#i-fuel" />
                    </svg>
                  </span>
                  <div>
                    <b>Pom Bensin (SPBU)</b>
                    <small>Tepat di depan lahan</small>
                  </div>
                  <span className="dist">100 m</span>
                </div>
                <div className="lcard">
                  <span className="lic">
                    <svg className="ic">
                      <use href="#i-wh" />
                    </svg>
                  </span>
                  <div>
                    <b>Pergudangan &amp; Hotel</b>
                    <small>Agregasi logistik &amp; menginap</small>
                  </div>
                  <span className="dist">500 m</span>
                </div>
                <div className="lcard">
                  <span className="lic">
                    <svg className="ic">
                      <use href="#i-bag" />
                    </svg>
                  </span>
                  <div>
                    <b>Pusat Perbelanjaan &amp; Mall</b>
                    <small>Belanja &amp; kuliner</small>
                  </div>
                  <span className="dist">1 km</span>
                </div>
                <div className="lcard">
                  <span className="lic">
                    <svg className="ic">
                      <use href="#i-cap" />
                    </svg>
                  </span>
                  <div>
                    <b>Universitas Negeri (Unsika) &amp; Swasta (UBP)</b>
                    <small>Pendidikan tinggi</small>
                  </div>
                  <span className="dist">1 km</span>
                </div>
                <div className="lcard">
                  <span className="lic">
                    <svg className="ic">
                      <use href="#i-factory" />
                    </svg>
                  </span>
                  <div>
                    <b>Kawasan Industri Mitra, Peruri, Bank BI &amp; KIIC</b>
                    <small>Sentra industri Karawang</small>
                  </div>
                  <span className="dist">3 km</span>
                </div>
                <div className="lcard">
                  <span className="lic">
                    <svg className="ic">
                      <use href="#i-city" />
                    </svg>
                  </span>
                  <div>
                    <b>Pusat Kota, Pintu Tol &amp; Stasiun MRT</b>
                    <small>Akses transportasi utama</small>
                  </div>
                  <span className="dist">3 km</span>
                </div>
                <div className="lcard">
                  <span className="lic">
                    <svg className="ic">
                      <use href="#i-factory" />
                    </svg>
                  </span>
                  <div>
                    <b>Kawasan Industri Surya Cipta &amp; Artha</b>
                    <small>Sentra industri Karawang</small>
                  </div>
                  <span className="dist">5 km</span>
                </div>
              </div>
              <div className="map-wrap">
                <div className="map-frame">
                  <iframe
                    title="Peta lokasi tanah di Jl. Raya Telukjambe, Telukjambe Timur, Kabupaten Karawang"
                    src="https://maps.google.com/maps?q=-6.3289088,107.3115949&z=16&hl=id&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
                <div className="map-note">
                  <span className="pin">
                    <svg className="ic">
                      <use href="#i-pin" />
                    </svg>
                    Jl. Raya Telukjambe, Telukjambe Timur, Kab. Karawang &#8212; 6&deg;19&prime;44.1&rdquo;S
                    107&deg;18&prime;41.7&rdquo;E
                  </span>
                  <a
                    className="btn-map"
                    href="https://maps.app.goo.gl/W5Xy4vQDStnSWwyS6"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="ic">
                      <use href="#i-pin" />
                    </svg>
                    Buka di Google Maps
                    <svg className="ic chev">
                      <use href="#i-chev" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </article>
        </section>

        <div className="dark">
          <section className="adv" id="keunggulan">
            <svg
              className="sw-adv"
              viewBox="0 0 500 46"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <linearGradient id="gsw2" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0" stopColor="#FFD409" />
                  <stop offset=".6" stopColor="#F5B921" />
                  <stop offset="1" stopColor="#D99F16" />
                </linearGradient>
              </defs>
              <path fill="url(#gsw2)" d="M500 2 C360 5 220 12 90 19 C60 21 30 23 0 24 L0 44 L500 32 Z" />
            </svg>
            <div className="wrap adv-in">
              <div className="adv-txt">
                <h2>Keunggulan Lokasi</h2>
                <ul className="chk gold">
                  <li>
                    <svg className="ic">
                      <use href="#i-check" />
                    </svg>
                    Berada di Jalan Raya Telukjambe Karawang
                  </li>
                  <li>
                    <svg className="ic">
                      <use href="#i-check" />
                    </svg>
                    Kawasan Industri KIIC, Mitra, Peruri &amp; Bank BI hanya 3 km
                  </li>
                  <li>
                    <svg className="ic">
                      <use href="#i-check" />
                    </svg>
                    Pusat kota, pintu tol &amp; stasiun MRT 3 km
                  </li>
                  <li>
                    <svg className="ic">
                      <use href="#i-check" />
                    </svg>
                    Universitas Unsika &amp; UBP, pusat perbelanjaan &amp; mall 1 km
                  </li>
                  <li>
                    <svg className="ic">
                      <use href="#i-check" />
                    </svg>
                    Pergudangan, hotel &amp; pom bensin (SPBU) radius 500&#8211;100 m
                  </li>
                  <li>
                    <svg className="ic">
                      <use href="#i-check" />
                    </svg>
                    Lingkungan berkembang pesat, potensi nilai investasi tinggi
                  </li>
                </ul>
              </div>
              <div className="adv-right">
                <figure className="adv-img">
                  <img
                    src="/images/img-14.jpg"
                    alt="Render area komersial dan perkantoran di sekitar Telukjambe Karawang"
                    width={262}
                    height={195}
                  />
                </figure>
                <div className="badge">
                  <span className="b-top">Harga Penawaran</span>
                  <span className="b-price">Rp 100 Milyard</span>
                  <span className="b-nego">Nego &#8211; Investasi Terbaik!</span>
                </div>
              </div>
            </div>
          </section>

          <section className="contact-sec" id="kontak">
            <div className="wrap">
              <div className="cbar">
                <div className="c-item">
                  <svg className="ic phone">
                    <use href="#i-phone" />
                  </svg>
                  <div>
                    <b>Hubungi Tim Pemasaran Sekarang!</b>
                    <small>Dapatkan informasi lengkap dan jadwalkan survei lokasi.</small>
                  </div>
                </div>
                <span className="c-div" />
                <a
                  className="c-item c-wa"
                  href="https://wa.me/6285781068441?text=Halo%2C%20saya%20tertarik%20dengan%20Tanah%20Strategis%204%20Hektare%20Telukjambe%20Karawang.%20Mohon%20info%20lengkapnya."
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp 0857 8106 8441"
                >
                  <svg className="ic waic">
                    <use href="#i-wa" />
                  </svg>
                  <b>0857 8106 8441</b>
                </a>
                <span className="c-div" />
                <a
                  className="btn-map"
                  href="https://maps.app.goo.gl/W5Xy4vQDStnSWwyS6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="ic">
                    <use href="#i-pin" />
                  </svg>
                  Lihat Lokasi di Google Maps
                  <svg className="ic chev">
                    <use href="#i-chev" />
                  </svg>
                </a>
              </div>

              <div className="cform-card">
                {submittedInquiry ? (
                  <div className="cform-success" role="status" aria-live="polite">
                    <svg className="ic cform-success-ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    <div>
                      <h3>Permintaan Informasi Berhasil Dikirim!</h3>
                      <p>
                        Terima kasih, tim pemasaran Mitra Property Indonesia telah menerima permintaan informasi Anda
                        untuk tanah strategis 4 hektare di Jl. Raya Telukjambe, Karawang dan akan segera menghubungi
                        Anda.
                      </p>
                      <div className="cform-summary">
                        <span>
                          <strong>Nama:</strong> {submittedInquiry.name}
                        </span>
                        <span>
                          <strong>Email:</strong> {submittedInquiry.email}
                        </span>
                        <span>
                          <strong>Telepon:</strong> {submittedInquiry.phone}
                        </span>
                      </div>
                      <div className="cform-success-btns">
                        <a
                          className="btn-submit"
                          href={`https://wa.me/6285781068441?text=${encodeURIComponent(
                            `Halo Mitra Property Indonesia, saya ${submittedInquiry.name} (${submittedInquiry.email} / ${submittedInquiry.phone}) ingin mendapatkan informasi lebih lanjut mengenai Tanah Strategis 4 Hektare di Jl. Raya Telukjambe, Karawang.`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg className="ic">
                            <use href="#i-wa" />
                          </svg>
                          Lanjutkan via WhatsApp
                        </a>
                        <button type="button" className="btn-ghost" onClick={handleResetInquiry}>
                          Kirim Permintaan Lain
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} noValidate>
                    <div className="cform-head">
                      <h3>Formulir Permintaan Informasi &amp; Jadwal Survei</h3>
                      <p>
                        Tinggalkan nama, email, dan nomor telepon Anda agar tim pemasaran kami dapat segera
                        menghubungi untuk informasi lengkap atau penjadwalan survei lokasi.
                      </p>
                    </div>
                    <div className="cform-grid">
                      <div className="cfield">
                        <label htmlFor="inquiry-name">Nama Lengkap</label>
                        <input
                          id="inquiry-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Contoh: Bpk. Budi Santoso"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                          }}
                          className={errors.name ? 'err' : undefined}
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? 'inquiry-name-error' : undefined}
                          required
                        />
                        {errors.name && (
                          <span id="inquiry-name-error" className="cfield-err">
                            {errors.name}
                          </span>
                        )}
                      </div>

                      <div className="cfield">
                        <label htmlFor="inquiry-email">Alamat Email</label>
                        <input
                          id="inquiry-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="Contoh: nama@perusahaan.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                          }}
                          className={errors.email ? 'err' : undefined}
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? 'inquiry-email-error' : undefined}
                          required
                        />
                        {errors.email && (
                          <span id="inquiry-email-error" className="cfield-err">
                            {errors.email}
                          </span>
                        )}
                      </div>

                      <div className="cfield">
                        <label htmlFor="inquiry-phone">Nomor Telepon / WhatsApp</label>
                        <input
                          id="inquiry-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="Contoh: 0812 3456 7890"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                          }}
                          className={errors.phone ? 'err' : undefined}
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={errors.phone ? 'inquiry-phone-error' : undefined}
                          required
                        />
                        {errors.phone && (
                          <span id="inquiry-phone-error" className="cfield-err">
                            {errors.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="cform-actions">
                      <span className="cform-note">
                        Data Anda hanya digunakan oleh tim Mitra Property Indonesia untuk tindak lanjut penawaran ini.
                      </span>
                      <button type="submit" className="btn-submit">
                        <svg className="ic">
                          <use href="#i-arrow" />
                        </svg>
                        Kirim Permintaan Informasi
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="wrap loc-sec" id="info-tanah">
          <article className="card">
            <h2 className="head">Info Harga &amp; Pemasaran</h2>
            <div className="card-b">
              <p className="loc-intro">
                Mitra Property Indonesia menjual tanah 40.000 m2 Karawang ini dengan harga tanah 4 hektare Karawang Rp
                100 milyard (nego). Stok tanah zona kuning Karawang dijual sangat terbatas &#8212; lahan tepi jalan raya
                bersertifikat SHM seperti ini jarang ditawarkan dan terus diminati korporasi maupun investor.
              </p>
              <p className="loc-intro">
                Setiap penawaran jual tanah strategis Karawang dari tim kami disertai pendampingan pengecekan
                sertifikat, survei lapangan, hingga negosiasi harga. Hubungi marketing kami di 0857 8106 8441 untuk
                informasi lengkap dan jadwal kunjungan lokasi.
              </p>
            </div>
          </article>
        </section>

        <div className="gold-sep" />

        <section className="wrap loc-sec" id="testimoni">
          <article className="card">
            <h2 className="head">Testimoni Klien</h2>
            <div className="card-b">
              <p className="loc-intro">
                Pengalaman klien yang telah melakukan survei dan bertransaksi bersama tim Mitra Property Indonesia
                untuk lahan 4 hektare di Jl. Raya Telukjambe Kabupaten Karawang.
              </p>
              <div className="rev-sum">
                <span className="stars" aria-hidden="true">
                  <svg className="ic">
                    <use href="#i-star" />
                  </svg>
                  <svg className="ic">
                    <use href="#i-star" />
                  </svg>
                  <svg className="ic">
                    <use href="#i-star" />
                  </svg>
                  <svg className="ic">
                    <use href="#i-star" />
                  </svg>
                  <svg className="ic">
                    <use href="#i-star" />
                  </svg>
                </span>
                <span>4,7 dari 5</span>
                <small>berdasarkan 3 ulasan klien</small>
              </div>
              <div className="rev-grid">
                <figure className="rev">
                  <span className="stars" aria-hidden="true">
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                  </span>
                  <p>
                    Tim Mitra Property Indonesia mendampingi pengecekan sertifikat SHM dan survei lapangan dari awal
                    sampai akhir. Lahan di Jl. Raya Telukjambe ini benar-benar strategis, tepat di jalan raya dan
                    dekat kawasan industri.
                  </p>
                  <figcaption>
                    <span className="av" aria-hidden="true">
                      HW
                    </span>
                    <span className="who">
                      <b>Bpk. Hendra W.</b>
                      <small>Survei lahan &#8212; Oktober 2026</small>
                    </span>
                  </figcaption>
                </figure>
                <figure className="rev">
                  <span className="stars" aria-hidden="true">
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                  </span>
                  <p>
                    Proses negosiasi dijalankan transparan dan cepat. Status zona kuning komersial membuat potensi
                    pengembangan gudang dan townhouse sangat menjanjikan. Sangat direkomendasikan untuk investor
                    properti Karawang.
                  </p>
                  <figcaption>
                    <span className="av" aria-hidden="true">
                      SA
                    </span>
                    <span className="who">
                      <b>Bpk. Suryadi A.</b>
                      <small>Investor properti &#8212; September 2026</small>
                    </span>
                  </figcaption>
                </figure>
                <figure className="rev">
                  <span className="stars" aria-hidden="true">
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic">
                      <use href="#i-star" />
                    </svg>
                    <svg className="ic dim">
                      <use href="#i-star" />
                    </svg>
                  </span>
                  <p>
                    Lokasi mudah dijangkau, dekat pintu tol dan universitas. Pengukuran ulang luasan 40.000 m2 sesuai
                    deskripsi penawaran. Marketing responsif lewat WhatsApp dan harga masih bisa nego.
                  </p>
                  <figcaption>
                    <span className="av" aria-hidden="true">
                      RD
                    </span>
                    <span className="who">
                      <b>Ibu Ratna D.</b>
                      <small>Kunjungan lokasi &#8212; Agustus 2026</small>
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </article>
        </section>

        <section className="wrap loc-sec" id="faq">
          <article className="card">
            <h2 className="head">Tanya Jawab (FAQ)</h2>
            <div className="card-b">
              <p className="loc-intro">
                Jawaban atas pertanyaan yang paling sering diajukan calon pembeli dan investor terkait legalitas
                sertifikat, mekanisme pembayaran, serta prosedur survei lokasi tanah 4 hektare di Telukjambe, Karawang.
              </p>
              <div className="faq-list">
                {FAQ_ITEMS.map((item) => {
                  const isOpen = openFaqId === item.id;
                  const panelId = `faq-panel-${item.id}`;
                  const buttonId = `faq-btn-${item.id}`;
                  return (
                    <div key={item.id} className={`faq-item${isOpen ? ' open' : ''}`}>
                      <button
                        id={buttonId}
                        type="button"
                        className="faq-btn"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                      >
                        <span className="faq-btn-txt">
                          <span className="faq-cat">{item.category}</span>
                          <span className="faq-q">{item.question}</span>
                        </span>
                        <span className="faq-chev" aria-hidden="true">
                          <svg className="ic">
                            <use href="#i-chev" />
                          </svg>
                        </span>
                      </button>
                      {isOpen && (
                        <div id={panelId} role="region" aria-labelledby={buttonId} className="faq-ans">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="faq-cta">
                <div className="faq-cta-txt">
                  <b>Masih ada pertanyaan lain seputar lahan atau jadwal kunjungan?</b>
                  <small>Konsultasikan langsung dengan tim pemasaran Mitra Property Indonesia.</small>
                </div>
                <a
                  className="btn-wa"
                  href="https://wa.me/6285781068441?text=Halo%20Mitra%20Property%20Indonesia%2C%20saya%20ingin%20bertanya%20mengenai%20legalitas%2C%20pembayaran%2C%20dan%20survei%20Tanah%204%20Hektare%20di%20Telukjambe%20Karawang."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="ic">
                    <use href="#i-wa" />
                  </svg>
                  Tanya Tim Pemasaran
                </a>
              </div>
            </div>
          </article>
        </section>
      </main>

      <footer>
        <div className="wrap f-in">
          <img
            src="/images/img-15.jpg"
            alt="Mitra Property Indonesia - Premium Property & Investment Network"
            width={255}
            height={110}
          />
          <span className="f-div" />
          <nav className="f-links" aria-label="Tagline">
            <span>Jual Tanah Strategis Karawang</span>
            <span>Properti Investasi</span>
            <span>Pengembangan Bisnis</span>
            <span>Masa Depan Lebih Baik</span>
          </nav>
          <div className="sos">
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg className="ic">
                <use href="#i-fb" />
              </svg>
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg className="ic">
                <use href="#i-yt" />
              </svg>
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg className="ic">
                <use href="#i-ig" />
              </svg>
            </a>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X">
              <svg className="ic">
                <use href="#i-x" />
              </svg>
            </a>
          </div>
        </div>
      </footer>

      <div className="share-fab-wrap" ref={shareRef}>
        {shareOpen && (
          <div className="share-menu" role="menu" aria-label="Opsi bagikan halaman">
            <div className="share-menu-hd">Bagikan Halaman Ini</div>
            <button type="button" className="share-opt" role="menuitem" onClick={handleCopyLink}>
              <span className={`share-opt-ic ${linkCopied ? 'copied' : 'copy'}`} aria-hidden="true">
                <svg className="ic">
                  <use href={linkCopied ? '#i-check' : '#i-link'} />
                </svg>
              </span>
              <span>{linkCopied ? 'Tautan Tersalin!' : 'Salin Tautan (Copy Link)'}</span>
            </button>
            <a
              className="share-opt"
              role="menuitem"
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShareOpen(false)}
            >
              <span className="share-opt-ic wa" aria-hidden="true">
                <svg className="ic">
                  <use href="#i-wa" />
                </svg>
              </span>
              <span>Bagikan ke WhatsApp</span>
            </a>
            <a
              className="share-opt"
              role="menuitem"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShareOpen(false)}
            >
              <span className="share-opt-ic fb" aria-hidden="true">
                <svg className="ic">
                  <use href="#i-fb" />
                </svg>
              </span>
              <span>Bagikan ke Facebook</span>
            </a>
          </div>
        )}
        <button
          type="button"
          className={`share-fab${shareOpen ? ' open' : ''}`}
          aria-expanded={shareOpen}
          aria-haspopup="menu"
          aria-label={shareOpen ? 'Tutup menu bagikan' : 'Bagikan halaman ini'}
          onClick={() => setShareOpen((prev) => !prev)}
        >
          <svg className="ic" aria-hidden="true">
            <use href={shareOpen ? '#i-close' : '#i-share'} />
          </svg>
          <span>{shareOpen ? 'Tutup' : 'Bagikan'}</span>
        </button>
      </div>
    </>
  );
}
