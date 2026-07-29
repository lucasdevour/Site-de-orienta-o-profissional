// exportService.js
// Gera currículos em PDF e Word com 10 variações de layout.

function formatarMarcadoresPDF(texto, fontSize = 12) {
    if (!texto) return null;
    var linhas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (linhas.length === 0) return null;
    return { ul: linhas, margin: [15, 1, 0, 2], fontSize: fontSize };
}

function getPdfTemplateStyles(id) {
    // Retorna { config, styles, headerAlignment, nameSize, nameColor, titleColor, lineColor }
    switch(id) {
        case '2': // Moderno Minimalista
            return {
                headerAlignment: 'left', nameSize: 24, nameColor: '#333333', titleColor: '#666666', lineColor: '#eeeeee',
                fontSize: 11, lineW: 1, uppercase: true
            };
        case '3': // Executivo Enxuto
            return {
                headerAlignment: 'center', nameSize: 16, nameColor: '#000000', titleColor: '#000000', lineColor: '#000000',
                fontSize: 10, lineW: 1, uppercase: true, margins: [40, 40, 40, 40]
            };
        case '4': // Criativo Azul
            return {
                headerAlignment: 'center', nameSize: 22, nameColor: '#1e3a8a', titleColor: '#1e3a8a', lineColor: '#bfdbfe',
                fontSize: 11, lineW: 2, uppercase: false
            };
        case '5': // Elegante Verde
            return {
                headerAlignment: 'left', nameSize: 20, nameColor: '#064e3b', titleColor: '#064e3b', lineColor: '#a7f3d0',
                fontSize: 12, lineW: 1, uppercase: true
            };
        case '6': // Destaque Lateral (Simulado com header right)
            return {
                headerAlignment: 'right', nameSize: 26, nameColor: '#111827', titleColor: '#111827', lineColor: '#e5e7eb',
                fontSize: 11, lineW: 3, uppercase: true
            };
        case '7': // Impacto Jovem
            return {
                headerAlignment: 'center', nameSize: 28, nameColor: '#000000', titleColor: '#e11d48', lineColor: '#e11d48',
                fontSize: 12, lineW: 4, uppercase: true
            };
        case '8': // Tradicional Forte
            return {
                headerAlignment: 'center', nameSize: 18, nameColor: '#000000', titleColor: '#000000', lineColor: '#000000',
                fontSize: 12, lineW: 2, uppercase: true
            };
        case '9': // Soft Minimal
            return {
                headerAlignment: 'left', nameSize: 18, nameColor: '#4b5563', titleColor: '#9ca3af', lineColor: 'transparent',
                fontSize: 11, lineW: 0, uppercase: false
            };
        case '10': // Profissional Tech
            return {
                headerAlignment: 'left', nameSize: 22, nameColor: '#0f172a', titleColor: '#3b82f6', lineColor: '#3b82f6',
                fontSize: 11, lineW: 1, uppercase: false, monospace: true
            };
        case '1':
        default: // Clássico Corporativo
            return {
                headerAlignment: 'center', nameSize: 20, nameColor: '#000000', titleColor: '#000000', lineColor: '#000000',
                fontSize: 12, lineW: 1, uppercase: true
            };
    }
}

export const exportToPDF = (v, templateId = '1') => {
    return new Promise((resolve) => {
        const style = getPdfTemplateStyles(templateId);
        var telDisplay = v.tel1 + (v.tel2 ? ' / ' + v.tel2 : '');
        const nomeFinal = style.uppercase ? (v.nome || 'CANDIDATO').toUpperCase() : (v.nome || 'Candidato');

        const enderecoFinal = [v.rua, v.numero, v.complemento].filter(Boolean).join(', ') + ' - ' + [v.bairro, v.cidade, v.estado].filter(Boolean).join(', ');
        const idadeDisplay = v.idade ? (v.idade.toString().toLowerCase().includes('ano') ? v.idade : `${v.idade} anos`) : '';

        var dadosPessoais = [];
        if (idadeDisplay) dadosPessoais.push({ text: [ {text: 'Idade: ', bold: true}, idadeDisplay ], margin: [0,0,0,2] });
        if (enderecoFinal.trim().length > 3) dadosPessoais.push({ text: [ {text: 'Endereço: ', bold: true}, enderecoFinal ], margin: [0,0,0,2] });
        if (telDisplay) dadosPessoais.push({ text: [ {text: 'Telefone: ', bold: true}, telDisplay ], margin: [0,0,0,2] });
        if (v.nacionalidade) dadosPessoais.push({ text: [ {text: 'Nacionalidade: ', bold: true}, v.nacionalidade ], margin: [0,0,0,2] });
        if (v.estado_civil) dadosPessoais.push({ text: [ {text: 'Estado civil: ', bold: true}, v.estado_civil ], margin: [0,0,0,2] });
        if (v.email) dadosPessoais.push({ text: [ {text: 'E-mail: ', bold: true}, v.email ], margin: [0,0,0,2] });
        if (v.cnh) dadosPessoais.push({ text: [ {text: 'CNH: ', bold: true}, v.cnh ], margin: [0,0,0,2] });

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

        var docDefinition = {
            pageSize: 'A4',
            pageMargins: style.margins || [50, 50, 50, 50], 
            defaultStyle: { fontSize: style.fontSize, color: '#333333', lineHeight: 1.2 },
            styles: {
                nomeTopo: { fontSize: style.nameSize, bold: true, alignment: style.headerAlignment, margin: [0, 0, 0, 8], color: style.nameColor },
                headerSessao: { fontSize: style.fontSize + 2, bold: true, margin: [0, 10, 0, 2], color: style.titleColor },
                blocoContainer: { margin: [0, 0, 0, 8], alignment: 'justify' }
            },
            content: [
                { text: nomeFinal, style: 'nomeTopo' },
                { stack: dadosPessoais, style: 'blocoContainer', alignment: style.headerAlignment },
                
                headerTitle('Objetivo Profissional'),
                { text: v.objetivo || '', style: 'blocoContainer' },
                
                headerTitle('Formação Acadêmica'),
                { text: v.formacao || '', style: 'blocoContainer' }
            ]
        };

        if (v.empresa1 || v.empresa2 || v.empresa3) {
            docDefinition.content.push(headerTitle('Experiências Profissionais'));
            
            const addExp = (emp, per, car, func) => {
                if (!emp) return;
                docDefinition.content.push({
                    columns: [
                        { text: [ {text: 'Empresa: ', bold: true}, emp ], width: '60%' },
                        { text: [ {text: 'Período: ', bold: true}, per ], width: '40%', alignment: 'right' }
                    ],
                    margin: [0, 2, 0, 2]
                });
                docDefinition.content.push({ text: [ {text: 'Cargo: ', bold: true}, car ], margin: [0,0,0,2] });
                docDefinition.content.push({ text: 'Funções:', bold: true, margin: [0, 0, 0, 1] });
                var m = formatarMarcadoresPDF(func, style.fontSize);
                if (m) docDefinition.content.push(m);
                docDefinition.content.push({ text: '', margin: [0, 0, 0, 6] });
            };

            addExp(v.empresa1, v.periodo1, v.cargo1, v.funcoes1);
            addExp(v.empresa2, v.periodo2, v.cargo2, v.funcoes2);
            addExp(v.empresa3, v.periodo3, v.cargo3, v.funcoes3);
        }

        if (v.cursos) {
            docDefinition.content.push(headerTitle('Cursos'));
            docDefinition.content.push({ text: v.cursos, style: 'blocoContainer' });
        }
        if (v.adicionais) {
            docDefinition.content.push(headerTitle('Informações Adicionais'));
            docDefinition.content.push({ text: v.adicionais, style: 'blocoContainer' });
        }

        const fileName = 'Curriculo_' + (v.nome ? v.nome.replace(/\s+/g, '_') : 'Candidato') + '.pdf';
        window.pdfMake.createPdf(docDefinition).download(fileName, () => resolve(true));
    });
};

// Word export logic
function converterParaMarcadoresHTML(texto, fontSize) {
    if (!texto) return '';
    var linhas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (linhas.length === 0) return '';
    var htmlLista = `<ul style="margin: 0 0 0 18pt; padding: 0; font-family: 'Arial', sans-serif; font-size: ${fontSize}pt; list-style-type: disc;">`;
    linhas.forEach(l => htmlLista += `<li style="margin: 0 0 1pt 0; padding: 0; line-height: 1.15; text-align: justify;">${l}</li>`);
    htmlLista += '</ul>';
    return htmlLista;
}

function txtParaBr(texto) { return texto ? texto.replace(/\n/g, '<br>') : ''; }

export const exportToWord = (v, templateId = '1') => {
    const style = getPdfTemplateStyles(templateId);
    var telDisplay = v.tel1 + (v.tel2 ? ' / ' + v.tel2 : '');
    const nomeFinal = style.uppercase ? (v.nome || 'CANDIDATO').toUpperCase() : (v.nome || 'Candidato');

    var pStyle = `style="margin: 0 0 1pt 0; padding: 0; font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt; line-height: 1.15; color: #333333;"`;
    
    var borderCss = style.lineW > 0 ? `border-bottom: ${style.lineW}px solid ${style.lineColor};` : '';
    var titleStyle = `style="font-family: 'Arial', sans-serif; font-size: ${style.fontSize+2}pt; font-weight: bold; ${borderCss} padding-bottom: 2pt; margin-top: 8pt; margin-bottom: 4pt; color: ${style.titleColor}; text-transform: ${style.uppercase ? 'uppercase' : 'none'}; text-align: left;"`;
    
    var blockStyle = `style="font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt; margin-bottom: 8pt; text-align: justify; line-height: 1.15; color: #333333;"`;

    const enderecoFinal = [v.rua, v.numero, v.complemento].filter(Boolean).join(', ') + ' - ' + [v.bairro, v.cidade, v.estado].filter(Boolean).join(', ');
    const idadeDisplay = v.idade ? (v.idade.toString().toLowerCase().includes('ano') ? v.idade : `${v.idade} anos`) : '';

    var dadosPessoaisHTML = '';
    if (idadeDisplay) dadosPessoaisHTML += `<p ${pStyle}><b>Idade:</b> ${idadeDisplay}</p>`;
    if (enderecoFinal.trim().length > 3) dadosPessoaisHTML += `<p ${pStyle}><b>Endereço:</b> ${enderecoFinal}</p>`;
    if (telDisplay) dadosPessoaisHTML += `<p ${pStyle}><b>Telefone:</b> ${telDisplay}</p>`;
    if (v.nacionalidade) dadosPessoaisHTML += `<p ${pStyle}><b>Nacionalidade:</b> ${v.nacionalidade}</p>`;
    if (v.estado_civil) dadosPessoaisHTML += `<p ${pStyle}><b>Estado civil:</b> ${v.estado_civil}</p>`;
    if (v.email) dadosPessoaisHTML += `<p ${pStyle}><b>E-mail:</b> ${v.email}</p>`;
    if (v.cnh) dadosPessoaisHTML += `<p ${pStyle}><b>CNH:</b> ${v.cnh}</p>`;

    var docHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8">
        <style>
            @page { size: 21.0cm 29.7cm; margin: 2.0cm; }
            body { font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt; color: #333333; }
        </style>
    </head>
    <body>
        <div style="font-family: 'Arial', sans-serif; font-size: ${style.nameSize}pt; font-weight: bold; text-align: ${style.headerAlignment}; margin-bottom: 8pt; color: ${style.nameColor}; text-transform: ${style.uppercase ? 'uppercase' : 'none'};">${nomeFinal}</div>
        <div style="text-align: ${style.headerAlignment}; margin-bottom: 8pt;">${dadosPessoaisHTML}</div>
        
        <div ${titleStyle}>${style.uppercase ? 'OBJETIVO PROFISSIONAL' : 'Objetivo Profissional'}</div>
        <div ${blockStyle}>${txtParaBr(v.objetivo)}</div>
        
        <div ${titleStyle}>${style.uppercase ? 'FORMAÇÃO ACADÊMICA' : 'Formação Acadêmica'}</div>
        <div ${blockStyle}>${txtParaBr(v.formacao)}</div>
    `;

    if (v.empresa1 || v.empresa2 || v.empresa3) {
        docHTML += `<div ${titleStyle}>${style.uppercase ? 'EXPERIÊNCIAS PROFISSIONAIS' : 'Experiências Profissionais'}</div>`;
        
        const addExpHTML = (emp, per, car, func) => {
            if (!emp) return;
            docHTML += `
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-top:2pt; margin-bottom:0pt; font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt;">
                    <tr><td style="font-weight:bold; width:60%;"><b>Empresa:</b> ${emp}</td><td style="text-align:right; font-weight:bold; width:40%;"><b>Período:</b> ${per}</td></tr>
                </table>
                <p ${pStyle}><b>Cargo:</b> ${car}</p>
                <p style="margin: 0 0 0pt 0; padding: 0; font-family: 'Arial', sans-serif; font-size: ${style.fontSize}pt; font-weight: bold;">Funções:</p>
                <div style="margin-bottom: 8pt;">${converterParaMarcadoresHTML(func, style.fontSize)}</div>`;
        };

        addExpHTML(v.empresa1, v.periodo1, v.cargo1, v.funcoes1);
        addExpHTML(v.empresa2, v.periodo2, v.cargo2, v.funcoes2);
        addExpHTML(v.empresa3, v.periodo3, v.cargo3, v.funcoes3);
    }
    
    if (v.cursos) docHTML += `<div ${titleStyle}>${style.uppercase ? 'CURSOS' : 'Cursos'}</div><div ${blockStyle}>${txtParaBr(v.cursos)}</div>`;
    if (v.adicionais) docHTML += `<div ${titleStyle}>${style.uppercase ? 'INFORMAÇÕES ADICIONAIS' : 'Informações Adicionais'}</div><div ${blockStyle}>${txtParaBr(v.adicionais)}</div>`;
    
    docHTML += `</body></html>`;

    var blob = new Blob(['\ufeff' + docHTML], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; 
    a.download = 'Curriculo_' + (v.nome ? v.nome.replace(/\s+/g, '_') : 'Candidato') + '.doc';
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url);
};
