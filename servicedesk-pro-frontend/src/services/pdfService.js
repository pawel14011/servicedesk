import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Generuj PDF formularza ticketu
// Generuj PDF formularza ticketu
export const generateTicketPDF = async (ticket, user, technician) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 10;

    // Font
    doc.setFont('helvetica');

    // ============= HEADER =============
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ServiceDesk Pro - Formularz Zgłoszenia', 10, 15);

    yPosition = 30;
    doc.setTextColor(0, 0, 0);

    // ============= INFORMACJE TICKETU =============
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACJE ZGŁOSZENIA', 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const ticketInfo = [
      ['Nr. Ticketu:', String(ticket.ticketNumber || 'Brak')],
      ['Status:', String(ticket.status || 'Brak')],
      ['Data utworzenia:', ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pl-PL') : 'Brak'],
      ['Asset Tag:', String(ticket.assetTag || 'Brak')],
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
    doc.text('DANE KLIENTA', 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Email: ${String(user?.email || 'Brak')}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Telefon: ${String(user?.phone || 'Brak')}`, 10, yPosition);
    yPosition += 10;

    // ============= DANE URZĄDZENIA =============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DANE URZĄDZENIA', 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const deviceInfo = [
      ['Marka:', String(ticket.device?.brand || 'Brak')],
      ['Model:', String(ticket.device?.model || 'Brak')],
      ['Nr. seryjny:', String(ticket.device?.serialNumber || 'Brak')],
      ['Rok produkcji:', String(ticket.device?.year || 'Brak')], // ← POPRAWKA
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
    doc.text('OPIS PROBLEMU', 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const descriptionLines = doc.splitTextToSize(String(ticket.description || 'Brak'), 190);
    doc.text(descriptionLines, 10, yPosition);
    yPosition += descriptionLines.length * 6 + 5;

    // ============= PRZYPISANIE =============
    if (technician) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PRZYPISANIE', 10, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Technik: ${String(technician.fullName || 'Brak')}`, 10, yPosition);
      yPosition += 6;
      doc.text(`Email: ${String(technician.email || 'Brak')}`, 10, yPosition);
      yPosition += 6;
      doc.text(`Telefon: ${String(technician.phone || 'Brak')}`, 10, yPosition);
    }

    // ============= FOOTER =============
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 10, pageHeight - 10);
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
    doc.text('ServiceDesk Pro - Raport Ticketów', 10, 15);

    yPosition = 30;
    doc.setTextColor(0, 0, 0);

    // ============= STATYSTYKI =============
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('STATYSTYKI', 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const statsInfo = [
      ['Łącznie ticketów:', stats.total],
      ['Otwarte:', stats.open],
      ['Zamknięte:', stats.closed],
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
    doc.text('LISTA TICKETÓW', 10, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Nagłówek tabeli
    doc.setFillColor(230, 230, 230);
    doc.rect(10, yPosition - 5, 190, 6, 'F');
    doc.text('Nr.', 12, yPosition);
    doc.text('Status', 40, yPosition);
    doc.text('Opis', 80, yPosition);
    doc.text('Data', 160, yPosition);
    yPosition += 8;

    // Wiersze
    tickets.slice(0, 20).forEach((ticket, idx) => {
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(String(idx + 1), 12, yPosition);
      doc.text(ticket.status.substring(0, 15), 40, yPosition);
      doc.text(ticket.description.substring(0, 30) + '...', 80, yPosition);
      doc.text(new Date(ticket.createdAt).toLocaleDateString('pl-PL'), 160, yPosition);
      yPosition += 6;
    });

    // ============= FOOTER =============
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 10, pageHeight - 10);

    const filename = `tickets-report-${Date.now()}.pdf`;
    doc.save(filename);

    console.log('✅ Report PDF generated:', filename);
    return filename;
  } catch (error) {
    console.error('Error generating report PDF:', error);
    throw error;
  }
};
