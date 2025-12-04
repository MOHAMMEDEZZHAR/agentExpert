"use client"

import type React from "react"

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#06b6d4",
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    marginRight: 15,
    backgroundColor: "#06b6d4",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  topicSection: {
    backgroundColor: "#f1f5f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
  },
  topicLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  topicText: {
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  heading1: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 15,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 1.6,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 11,
    color: "#334155",
    marginLeft: 15,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: "#94a3b8",
  },
})

interface PDFDocumentProps {
  topic: string
  result: string
  date: string
}

const parseMarkdown = (text: string) => {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []

  lines.forEach((line, index) => {
    if (line.startsWith("### ")) {
      elements.push(
        <Text key={index} style={styles.heading3}>
          {line.slice(4)}
        </Text>,
      )
    } else if (line.startsWith("## ")) {
      elements.push(
        <Text key={index} style={styles.heading2}>
          {line.slice(3)}
        </Text>,
      )
    } else if (line.startsWith("# ")) {
      elements.push(
        <Text key={index} style={styles.heading1}>
          {line.slice(2)}
        </Text>,
      )
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <Text key={index} style={styles.listItem}>
          • {line.slice(2)}
        </Text>,
      )
    } else if (line.match(/^\d+\. /)) {
      elements.push(
        <Text key={index} style={styles.listItem}>
          {line}
        </Text>,
      )
    } else if (line.trim() !== "") {
      elements.push(
        <Text key={index} style={styles.paragraph}>
          {line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")}
        </Text>,
      )
    }
  })

  return elements
}

const PDFDocument = ({ topic, result, date }: PDFDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>AI</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>AI Expert Agents Studio</Text>
          <Text style={styles.subtitle}>Rapport de mission - {date}</Text>
        </View>
      </View>

      <View style={styles.topicSection}>
        <Text style={styles.topicLabel}>Topic analysé</Text>
        <Text style={styles.topicText}>{topic}</Text>
      </View>

      <View>{parseMarkdown(result)}</View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>AI Expert Agents Studio</Text>
        <Text style={styles.footerText}>Généré le {date}</Text>
      </View>
    </Page>
  </Document>
)

export async function exportToPDF(topic: string, result: string): Promise<void> {
  const date = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const blob = await pdf(<PDFDocument topic={topic} result={result} date={date} />).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `rapport-${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
