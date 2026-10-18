// exportService.js
// Gera currículos em PDF e Word (.doc) com 10 variações de layout e suporte completo a ATS (Resumo, Habilidades, Idiomas, Experiências).

function formatarMarcadoresPDF(texto, fontSize = 11) {
    if (!texto) return null;
    const linhas = texto
        .split('\n')
        .map(l => l.replace(/^[•\-*]\s*/, '').trim())
        .filter(l => l.length > 0);
    if (linhas.length === 0) return null;
    return { ul: linhas, margin: [14, 2, 0, 4], fontSize: fontSize };
}

function getPdfTemplateStyles(id) {
    switch (String(id)) {
        case '2': // Moderno Minimalista
            return {
                headerAlignment: 'left', nameSize: 22, nameColor: '#1e293b', titleColor: '#334155', lineColor: '#cbd5e1',
                fontSize: 10.5, lineW: 1, uppercase: true
            };
        case '3': // Executivo Enxuto
            return {
                headerAlignment: 'center', nameSize: 16, nameColor: '#000000', titleColor: '#000000', lineColor: '#000000',
                fontSize: 10, lineW: 1, uppercase: true, margins: [36, 36, 36, 36]
            };
        case '4': // Criativo Azul
            return {
                headerAlignment: 'center', nameSize: 21, nameColor: '#1e3a8a', titleColor: '#1e3a8a', lineColor: '#93c5fd',
                fontSize: 10.5, lineW: 1.5, uppercase: false
            };
        case '5': // Elegante Verde
            return {
                headerAlignment: 'left', nameSize: 20, nameColor: '#064e3b', titleColor: '#065f46', lineColor: '#6ee7b7',
                fontSize: 11, lineW: 1, uppercase: true
            };
        case '6': // Destaque Lateral
            return {
                headerAlignment: 'right', nameSize: 22, nameColor: '#111827', titleColor: '#111827', lineColor: '#d1d5db',
                fontSize: 10.5, lineW: 2, uppercase: true
            };
        case '7': // Impacto Jovem
            return {
                headerAlignment: 'center', nameSize: 24, nameColor: '#0f172a', titleColor: '#4f46e5', lineColor: '#4f46e5',
                fontSize: 11, lineW: 2.5, uppercase: true
            };
        case '8': // Tradicional Forte (ATS Puro)
            return {
                headerAlignment: 'center', nameSize: 18, nameColor: '#000000', titleColor: '#000000', lineColor: '#000000',
                fontSize: 11, lineW: 1.5, uppercase: true
            };
        case '9': // Soft Minimal
            return {
                headerAlignment: 'left', nameSize: 19, nameColor: '#374151', titleColor: '#4b5563', lineColor: '#e5e7eb',
                fontSize: 10.5, lineW: 0.5, uppercase: false
            };
        case '10': // Profissional Tech
            return {
                headerAlignment: 'left', nameSize: 21, nameColor: '#0f172a', titleColor: '#2563eb', lineColor: '#2563eb',
                fontSize: 10.5, lineW: 1, uppercase: false
            };
        case '1':
        default: // Clássico Corporativo (ATS Padrão)
            return {
                headerAlignment: 'center', nameSize: 20, nameColor: '#000000', titleColor: '#000000', lineColor: '#000000',
                fontSize: 11, lineW: 1, uppercase: true
            };
    }
}

export const exportToPDF = (v, templateId = '1') => {
    return new Promise((resolve) => {
        if (!window.pdfMake) {
            alert('Biblioteca de geração de PDF ainda está carregando. Tente novamente em instantes.');
            resolve(false);
            return;
        }

        const style = getPdfTemplateStyles(templateId);
        const telDisplay = [v.tel1, v.tel2].filter(Boolean).join(' / ');
        const nomeFinal = style.uppercase ? (v.nome || 'CANDIDATO').toUpperCase() : (v.nome || 'Candidato');

        const partesEndereco = [v.rua, v.numero, v.complemento].filter(Boolean).join(', ');
        const partesCidade = [v.bairro, v.cidade, v.estado].filter(Boolean).join(' - ');
        const enderecoFinal = [partesEndereco, partesCidade].filter(Boolean).join(' | ');
        const idadeDisplay = v.idade ? (v.idade.toString().toLowerCase().includes('ano') ? v.idade : `${v.idade} anos`) : '';

        const dadosPessoais = [];
        if (enderecoFinal.trim().length > 2) dadosPessoais.push({ text: [{ text: 'Localização: ', bold: true }, enderecoFinal], margin: [0, 0, 0, 2] });
        if (telDisplay) dadosPessoais.push({ text: [{ text: 'Telefone / WhatsApp: ', bold: true }, telDisplay], margin: [0, 0, 0, 2] });
        if (v.email) dadosPessoais.push({ text: [{ text: 'E-mail: ', bold: true }, v.email], margin: [0, 0, 0, 2] });
        if (v.linkedin) dadosPessoais.push({ text: [{ text: 'LinkedIn / Portfólio: ', bold: true }, v.linkedin], margin: [0, 0, 0, 2] });

        const linhaExtra = [
            idadeDisplay ? `Idade: ${idadeDisplay}` : '',
            v.nacionalidade ? `Nacionalidade: ${v.nacionalidade}` : '',
            v.estado_civil ? `Estado Civil: ${v.estado_civil}` : '',
            v.cnh ? `CNH: ${v.cnh}` : ''
        ].filter(Boolean).join('  •  ');
        if (linhaExtra) dadosPessoais.push({ text: linhaExtra, margin: [0, 2, 0, 2], color: '#555555', fontSize: style.fontSize - 0.5 });

        const headerTitle = (text) => {
            const arr = [
                { text: style.uppercase ? text.toUpperCase() : text, style: 'headerSessao' }
            ];
            if (style.lineW > 0) {
                arr.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 500, y2: 0, lineWidth: style.lineW, lineColor: style.lineColor }] });
            }
            arr.push({ text: '', margin: [0, 4, 0, 0] });
            return arr;
        };

        const content = [
            { text: nomeFinal, style: 'nomeTopo' },
            { stack: dadosPessoais, style: 'blocoContainer', alignment: style.headerAlignment }
        ];

        if (v.objetivo) {
            content.push(headerTitle('Objetivo Profissional'));
            content.push({ text: v.objetivo, bold: true, style: 'blocoContainer' });
        }

        if (v.resumo) {
            content.push(headerTitle('Resumo Profissional'));
            content.push({ text: v.resumo, style: 'blocoContainer' });
        }

        if (v.habilidades) {
            content.push(headerTitle('Habilidades e Competências Técnicas'));
            content.push({ text: v.habilidades, style: 'blocoContainer' });
        }

        if (v.empresa1 || v.empresa2 || v.empresa3) {
            content.push(headerTitle('Experiência Profissional'));

            const addExp = (emp, per, car, func) => {
                if (!emp && !car && !func) return;
                content.push({
                    columns: [
                        { text: [{ text: emp || 'Experiência Profissional', bold: true }], width: '65%' },
                        { text: per || '', width: '35%', alignment: 'right', italics: true }
                    ],
                    margin: [0, 3, 0, 1]
                });
                if (car) {
                    content.push({ text: [{ text: 'Cargo: ', bold: true }, car], margin: [0, 0, 0, 2] });
                }
                const m = formatarMarcadoresPDF(func, style.fontSize);
                if (m) content.push(m);
                content.push({ text: '', margin: [0, 0, 0, 5] });
            };

            addExp(v.empresa1, v.periodo1, v.cargo1, v.funcoes1);
            addExp(v.empresa2, v.periodo2, v.cargo2, v.funcoes2);
            addExp(v.empresa3, v.periodo3, v.cargo3, v.funcoes3);
        }

        if (v.formacao) {
            content.push(headerTitle('Formação Acadêmica'));
            content.push({ text: v.formacao, style: 'blocoContainer' });
        }

        if (v.cursos) {
            content.push(headerTitle('Cursos e Certificações'));
            content.push({ text: v.cursos, style: 'blocoContainer' });
        }

        if (v.idiomas) {
            content.push(headerTitle('Idiomas'));
            content.push({ text: v.idiomas, style: 'blocoContainer' });
        }

        if (v.adicionais) {
            content.push(headerTitle('Informações Adicionais'));
            content.push({ text: v.adicionais, style: 'blocoContainer' });
        }

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: style.margins || [45, 45, 45, 45],
            defaultStyle: { fontSize: style.fontSize, color: '#222222', lineHeight: 1.22 },
            styles: {
                nomeTopo: { fontSize: style.nameSize, bold: true, alignment: style.headerAlignment, margin: [0, 0, 0, 6], color: style.nameColor },
                headerSessao: { fontSize: style.fontSize + 1.5, bold: true, margin: [0, 9, 0, 2], color: style.titleColor },
                blocoContainer: { margin: [0, 0, 0, 6], alignment: 'justify' }
            },
            content
        };

        const fileName = 'Curriculo_' + (v.nome ? v.nome.trim().replace(/\s+/g, '_') : 'Candidato') + '.pdf';
        window.pdfMake.createPdf(docDefinition).download(fileName, () => resolve(true));
    });
};

// Word (.doc) export logic
function converterParaMarcadoresHTML(texto, fontSize) {
    if (!texto) return '';
    const linhas = texto
        .split('\n')
        .map(l => l.replace(/^[•\-*]\s*/, '').trim())
        .filter(l => l.length > 0);
    if (linhas.length === 0) return '';
    let htmlLista = `<ul style="margin: 2pt 0 6pt 18pt; padding: 0; font-family: 'Arial', sans-serif; font-size: ${fontSize}pt; list-style-type: disc;">`;
    linhas.forEach(l => {
        htmlLista += `<li style="margin: 0 0 2pt 0; padding: 0; line-height: 1.2; text-align: justify;">${l}</li>`;
    });
    htmlLista += '</ul>';
    return htmlLista;
}

function txtParaBr(texto) {
    return texto ? texto.replace(/\n/g, '<br>') : '';
}

export const exportToWord = (v, templateId = '1') => {
    const style = getPdfTemplateStyles(templateId);
    const telDisplay = [v.tel1, v.tel2].filter(Boolean).join(' / ');
    const nomeFinal = style.uppercase ? (v.nome || 'CANDIDATO').toUpperCase() : (v.nome || 'Candidato');

    const pStyle = `style="margin: 0 0 2pt 0; padding: 0; font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt; line-height: 1.2; color: #222222;"`;
    const borderCss = style.lineW > 0 ? `border-bottom: ${style.lineW}px solid ${style.lineColor};` : '';
    const titleStyle = `style="font-family: 'Arial', sans-serif; font-size: ${style.fontSize + 1.5}pt; font-weight: bold; ${borderCss} padding-bottom: 2pt; margin-top: 10pt; margin-bottom: 4pt; color: ${style.titleColor}; text-transform: ${style.uppercase ? 'uppercase' : 'none'}; text-align: left;"`;
    const blockStyle = `style="font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt; margin-bottom: 6pt; text-align: justify; line-height: 1.22; color: #222222;"`;

    const partesEndereco = [v.rua, v.numero, v.complemento].filter(Boolean).join(', ');
    const partesCidade = [v.bairro, v.cidade, v.estado].filter(Boolean).join(' - ');
    const enderecoFinal = [partesEndereco, partesCidade].filter(Boolean).join(' | ');
    const idadeDisplay = v.idade ? (v.idade.toString().toLowerCase().includes('ano') ? v.idade : `${v.idade} anos`) : '';

    let dadosPessoaisHTML = '';
    if (enderecoFinal.trim().length > 2) dadosPessoaisHTML += `<p ${pStyle}><b>Localização:</b> ${enderecoFinal}</p>`;
    if (telDisplay) dadosPessoaisHTML += `<p ${pStyle}><b>Telefone / WhatsApp:</b> ${telDisplay}</p>`;
    if (v.email) dadosPessoaisHTML += `<p ${pStyle}><b>E-mail:</b> ${v.email}</p>`;
    if (v.linkedin) dadosPessoaisHTML += `<p ${pStyle}><b>LinkedIn:</b> ${v.linkedin}</p>`;
    const linhaExtra = [
        idadeDisplay ? `Idade: ${idadeDisplay}` : '',
        v.nacionalidade ? `Nacionalidade: ${v.nacionalidade}` : '',
        v.estado_civil ? `Estado Civil: ${v.estado_civil}` : '',
        v.cnh ? `CNH: ${v.cnh}` : ''
    ].filter(Boolean).join(' • ');
    if (linhaExtra) dadosPessoaisHTML += `<p ${pStyle}>${linhaExtra}</p>`;

    let docHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8">
        <style>
            @page { size: 21.0cm 29.7cm; margin: 1.8cm; }
            body { font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt; color: #222222; }
        </style>
    </head>
    <body>
        <div style="font-family: 'Arial', sans-serif; font-size: ${style.nameSize}pt; font-weight: bold; text-align: ${style.headerAlignment}; margin-bottom: 6pt; color: ${style.nameColor}; text-transform: ${style.uppercase ? 'uppercase' : 'none'};">${nomeFinal}</div>
        <div style="text-align: ${style.headerAlignment}; margin-bottom: 8pt;">${dadosPessoaisHTML}</div>
    `;

    if (v.objetivo) {
        docHTML += `<div ${titleStyle}>Objetivo Profissional</div><div ${blockStyle}><b>${txtParaBr(v.objetivo)}</b></div>`;
    }
    if (v.resumo) {
        docHTML += `<div ${titleStyle}>Resumo Profissional</div><div ${blockStyle}>${txtParaBr(v.resumo)}</div>`;
    }
    if (v.habilidades) {
        docHTML += `<div ${titleStyle}>Habilidades e Competências Técnicas</div><div ${blockStyle}>${txtParaBr(v.habilidades)}</div>`;
    }

    if (v.empresa1 || v.empresa2 || v.empresa3) {
        docHTML += `<div ${titleStyle}>Experiência Profissional</div>`;

        const addExpHTML = (emp, per, car, func) => {
            if (!emp && !car && !func) return;
            docHTML += `
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-top:4pt; margin-bottom:1pt; font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt;">
                    <tr><td style="font-weight:bold; width:65%;">${emp || ''}</td><td style="text-align:right; font-style:italic; width:35%;">${per || ''}</td></tr>
                </table>
                ${car ? `<p ${pStyle}><b>Cargo:</b> ${car}</p>` : ''}
                ${converterParaMarcadoresHTML(func, style.fontSize)}`;
        };

        addExpHTML(v.empresa1, v.periodo1, v.cargo1, v.funcoes1);
        addExpHTML(v.empresa2, v.periodo2, v.cargo2, v.funcoes2);
        addExpHTML(v.empresa3, v.periodo3, v.cargo3, v.funcoes3);
    }

    if (v.formacao) docHTML += `<div ${titleStyle}>Formação Acadêmica</div><div ${blockStyle}>${txtParaBr(v.formacao)}</div>`;
    if (v.cursos) docHTML += `<div ${titleStyle}>Cursos e Certificações</div><div ${blockStyle}>${txtParaBr(v.cursos)}</div>`;
    if (v.idiomas) docHTML += `<div ${titleStyle}>Idiomas</div><div ${blockStyle}>${txtParaBr(v.idiomas)}</div>`;
    if (v.adicionais) docHTML += `<div ${titleStyle}>Informações Adicionais</div><div ${blockStyle}>${txtParaBr(v.adicionais)}</div>`;

    docHTML += `</body></html>`;

    const blob = new Blob(['\ufeff' + docHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Curriculo_' + (v.nome ? v.nome.trim().replace(/\s+/g, '_') : 'Candidato') + '.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
