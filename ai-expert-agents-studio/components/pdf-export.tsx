"use client"

export async function exportToPDF(topic: string, result: string): Promise<void> {
  try {
    const { jsPDF } = await import("jspdf")
    const html2canvas = (await import("html2canvas")).default

    // Create temporary div with styled content
    const tempDiv = document.createElement("div")
    tempDiv.style.position = "absolute"
    tempDiv.style.left = "-9999px"
    tempDiv.style.width = "800px"
    tempDiv.style.padding = "40px"
    tempDiv.style.backgroundColor = "white"
    tempDiv.style.fontFamily = "Arial, sans-serif"
    tempDiv.style.lineHeight = "1.6"
    tempDiv.style.color = "#333"

    // Header
    const header = document.createElement("div")
    header.style.borderBottom = "2px solid #06b6d4"
    header.style.paddingBottom = "20px"
    header.style.marginBottom = "30px"

    const title = document.createElement("h1")
    title.textContent = "Rapport d'Analyse"
    title.style.margin = "0"
    title.style.fontSize = "28px"
    title.style.color = "#0f172a"
    title.style.marginBottom = "5px"
    title.style.fontWeight = "bold"

    const date = document.createElement("p")
    date.textContent = `Généré le ${new Date().toLocaleDateString("fr-FR")}`
    date.style.margin = "0"
    date.style.fontSize = "12px"
    date.style.color = "#64748b"

    header.appendChild(title)
    header.appendChild(date)
    tempDiv.appendChild(header)

    // Topic section
    const topicSection = document.createElement("div")
    topicSection.style.backgroundColor = "#f1f5f9"
    topicSection.style.padding = "15px"
    topicSection.style.borderRadius = "8px"
    topicSection.style.marginBottom = "25px"

    const topicLabel = document.createElement("p")
    topicLabel.textContent = "TOPIC ANALYSÉ"
    topicLabel.style.margin = "0"
    topicLabel.style.fontSize = "10px"
    topicLabel.style.color = "#64748b"
    topicLabel.style.marginBottom = "5px"
    topicLabel.style.textTransform = "uppercase"
    topicLabel.style.letterSpacing = "1px"
    topicLabel.style.fontWeight = "bold"

    const topicText = document.createElement("p")
    topicText.textContent = topic
    topicText.style.margin = "0"
    topicText.style.fontSize = "14px"
    topicText.style.color = "#0f172a"

    topicSection.appendChild(topicLabel)
    topicSection.appendChild(topicText)
    tempDiv.appendChild(topicSection)

    // Result section - parse markdown
    const resultSection = document.createElement("div")
    const lines = result.split("\n")

    lines.forEach((line) => {
      const p = document.createElement("div")

      if (line.startsWith("### ")) {
        p.innerHTML = `<h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 12px; margin-bottom: 6px; margin: 0;">${line.slice(4)}</h3>`
      } else if (line.startsWith("## ")) {
        p.innerHTML = `<h2 style="font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 15px; margin-bottom: 8px; margin: 0;">${line.slice(3)}</h2>`
      } else if (line.startsWith("# ")) {
        p.innerHTML = `<h1 style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 20px; margin-bottom: 10px; margin: 0;">${line.slice(2)}</h1>`
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        p.innerHTML = `<li style="font-size: 11px; color: #334155; margin-left: 15px; margin-bottom: 5px; line-height: 1.5;">${line.slice(2)}</li>`
      } else if (line.match(/^\d+\. /)) {
        p.innerHTML = `<li style="font-size: 11px; color: #334155; margin-left: 15px; margin-bottom: 5px;">${line}</li>`
      } else if (line.trim() !== "") {
        p.innerHTML = `<p style="font-size: 11px; color: #334155; line-height: 1.6; margin-bottom: 10px; margin: 0;">${line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>")}</p>`
      }

      if (p.innerHTML) {
        resultSection.appendChild(p)
      }
    })

    tempDiv.appendChild(resultSection)

    // Footer
    const footer = document.createElement("div")
    footer.style.borderTop = "1px solid #e2e8f0"
    footer.style.paddingTop = "15px"
    footer.style.marginTop = "30px"
    footer.style.display = "flex"
    footer.style.justifyContent = "space-between"
    footer.innerHTML = `<p style="font-size: 9px; color: #94a3b8; margin: 0;">AI Expert Agents Studio</p><p style="font-size: 9px; color: #94a3b8; margin: 0;">Généré le ${new Date().toLocaleDateString("fr-FR")}</p>`
    tempDiv.appendChild(footer)

    document.body.appendChild(tempDiv)

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
    })

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const imgData = canvas.toDataURL("image/png")
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Download
    pdf.save(`rapport-${new Date().toISOString().slice(0, 10)}.pdf`)

    // Cleanup
    document.body.removeChild(tempDiv)
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error)
    alert("Erreur lors de la génération du PDF")
  }
}
