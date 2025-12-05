import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper function to encode Polish characters
const encodePolishChars = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/Ą/g, 'A')
    .replace(/Ć/g, 'C')
    .replace(/Ę/g, 'E')
    .replace(/Ł/g, 'L')
    .replace(/Ń/g, 'N')
    .replace(/Ó/g, 'O')
    .replace(/Ś/g, 'S')
    .replace(/Ź/g, 'Z')
    .replace(/Ż/g, 'Z');
};

// Generuj PDF formularza ticketu
export const generateTicketPDF = async (ticket, user, technician) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 10;

    // Font - używamy standardowego fontu, polskie znaki będą zakodowane
    doc.setFont('helvetica');

    // ============= HEADER =============
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(encodePolishChars('ServiceDesk Pro - Formularz Zgloszenia'), 10, 15);

    yPosition = 30;
    doc.setTextColor(0, 0, 0);

    // ============= INFORMACJE TICKETU =============
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(encodePolishChars('INFORMACJE ZGLOSZENIA'), 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const ticketInfo = [
      [encodePolishChars('Nr. Ticketu:'), encodePolishChars(String(ticket.ticketNumber || 'Brak'))],
      [encodePolishChars('Status:'), encodePolishChars(String(ticket.status || 'Brak'))],
      [encodePolishChars('Data utworzenia:'), ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pl-PL') : 'Brak'],
      [encodePolishChars('Asset Tag:'), encodePolishChars(String(ticket.assetTag || 'Brak'))],
    ];

    ticketInfo.forEach(info => {
      doc.text(info[0], 10, yPosition);
      doc.text(info[1], 60, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // ============= DANE KLIENTA =============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(encodePolishChars('DANE KLIENTA'), 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(encodePolishChars(`Email: ${String(user?.email || 'Brak')}`), 10, yPosition);
    yPosition += 6;
    doc.text(encodePolishChars(`Telefon: ${String(user?.phone || 'Brak')}`), 10, yPosition);
    yPosition += 10;

    // ============= DANE URZĄDZENIA =============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(encodePolishChars('DANE URZADZENIA'), 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const deviceInfo = [
      [encodePolishChars('Marka:'), encodePolishChars(String(ticket.device?.brand || 'Brak'))],
      [encodePolishChars('Model:'), encodePolishChars(String(ticket.device?.model || 'Brak'))],
      [encodePolishChars('Nr. seryjny:'), encodePolishChars(String(ticket.device?.serialNumber || 'Brak'))],
      [encodePolishChars('Rok produkcji:'), encodePolishChars(String(ticket.device?.year || 'Brak'))],
    ];

    deviceInfo.forEach(info => {
      doc.text(info[0], 10, yPosition);
      doc.text(info[1], 60, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // ============= OPIS PROBLEMU =============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(encodePolishChars('OPIS PROBLEMU'), 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const descriptionLines = doc.splitTextToSize(encodePolishChars(String(ticket.description || 'Brak')), 190);
    doc.text(descriptionLines, 10, yPosition);
    yPosition += descriptionLines.length * 6 + 5;

    // ============= PRZYPISANIE =============
    if (technician) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(encodePolishChars('PRZYPISANIE'), 10, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(encodePolishChars(`Technik: ${String(technician.fullName || 'Brak')}`), 10, yPosition);
      yPosition += 6;
      doc.text(encodePolishChars(`Email: ${String(technician.email || 'Brak')}`), 10, yPosition);
      yPosition += 6;
      doc.text(encodePolishChars(`Telefon: ${String(technician.phone || 'Brak')}`), 10, yPosition);
    }

    // ============= FOOTER =============
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(encodePolishChars(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`), 10, pageHeight - 10);
    doc.text(`Ticket ID: ${String(ticket.id)}`, pageWidth - 50, pageHeight - 10);

    // Pobierz plik
    const filename = `ticket-${ticket.ticketNumber}-${Date.now()}.pdf`;
    doc.save(filename);

    console.log('✅ PDF generated:', filename);
    return filename;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};


// Helper function to encode Polish characters (reuse from above)
const encodePolishCharsReport = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/Ą/g, 'A')
    .replace(/Ć/g, 'C')
    .replace(/Ę/g, 'E')
    .replace(/Ł/g, 'L')
    .replace(/Ń/g, 'N')
    .replace(/Ó/g, 'O')
    .replace(/Ś/g, 'S')
    .replace(/Ź/g, 'Z')
    .replace(/Ż/g, 'Z');
};

// Generuj PDF raportu ticketów
export const generateTicketsReportPDF = (tickets, stats) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 10;

    doc.setFont('helvetica');

    // ============= HEADER =============
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(encodePolishCharsReport('ServiceDesk Pro - Raport Ticketow'), 10, 15);

    yPosition = 30;
    doc.setTextColor(0, 0, 0);

    // ============= STATYSTYKI =============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(encodePolishCharsReport('STATYSTYKI'), 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const statsInfo = [
      [encodePolishCharsReport('Lacznie ticketow:'), stats.total],
      [encodePolishCharsReport('Otwarte:'), stats.open],
      [encodePolishCharsReport('Zamkniete:'), stats.closed],
    ];

    statsInfo.forEach((info) => {
      doc.text(info[0], 10, yPosition);
      doc.text(String(info[1]), 80, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // ============= LISTA TICKETÓW =============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(encodePolishCharsReport('LISTA TICKETOW'), 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Nagłówek tabeli
    doc.setFillColor(230, 230, 230);
    doc.rect(10, yPosition - 5, 190, 6, 'F');
    doc.text('Nr.', 12, yPosition);
    doc.text(encodePolishCharsReport('Status'), 40, yPosition);
    doc.text(encodePolishCharsReport('Opis'), 80, yPosition);
    doc.text(encodePolishCharsReport('Data'), 160, yPosition);
    yPosition += 8;

    // Wiersze
    tickets.slice(0, 20).forEach((ticket, idx) => {
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(String(idx + 1), 12, yPosition);
      doc.text(encodePolishCharsReport(ticket.status.substring(0, 15)), 40, yPosition);
      doc.text(encodePolishCharsReport(ticket.description.substring(0, 30) + '...'), 80, yPosition);
      doc.text(new Date(ticket.createdAt).toLocaleDateString('pl-PL'), 160, yPosition);
      yPosition += 6;
    });

    // ============= FOOTER =============
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(encodePolishCharsReport(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`), 10, pageHeight - 10);

    const filename = `tickets-report-${Date.now()}.pdf`;
    doc.save(filename);

    console.log('✅ Report PDF generated:', filename);
    return filename;
  } catch (error) {
    console.error('Error generating report PDF:', error);
    throw error;
  }
};
