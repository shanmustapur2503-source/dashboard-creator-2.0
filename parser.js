/**
 * Commercial-Grade Client-Side CSV Ingestion Engine
 */
class UniversalDataParser {
    constructor() {
        this.data = [];
        this.schema = {};
        this.stats = { totalRows: 0, missingValues: 0, duplicates: 0, qualityScore: 100 };
    }

    parseCSV(csvText) {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length === 0) return null;

        // Extract and clean headers
        const headers = this.parseCSVLine(lines[0]);
        const rows = [];
        let missingCount = 0;
        const rowSet = new Set();
        let duplicateCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const rawLine = lines[i].trim();
            if (rowSet.has(rawLine)) {
                duplicateCount++;
            } else {
                rowSet.add(rawLine);
            }

            const values = this.parseCSVLine(lines[i]);
            const rowObj = {};

            headers.forEach((header, idx) => {
                let val = values[idx] !== undefined ? values[idx].trim() : null;
                if (val === "" || val === null) {
                    val = null;
                    missingCount++;
                }
                rowObj[header] = val;
            });
            rows.push(rowObj);
        }

        this.schema = this.inferSchema(headers, rows);
        this.data = this.castDataset(rows, this.schema);
        
        const totalCells = rows.length * headers.length;
        this.stats = {
            totalRows: rows.length,
            missingValues: missingCount,
            duplicates: duplicateCount,
            qualityScore: totalCells > 0 ? Math.max(0, Math.round(100 - (missingCount / totalCells) * 100)) : 100
        };

        return { data: this.data, schema: this.schema, stats: this.stats };
    }

    parseCSVLine(line) {
        const result = [];
        let start = 0;
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                inQuotes = !inQuotes;
            } else if (c === ',' && !inQuotes) {
                result.push(line.substring(start, i).replace(/^"|"$/g, ''));
                start = i + 1;
            }
        }
        result.push(line.substring(start).replace(/^"|"$/g, ''));
        return result;
    }

    inferSchema(headers, rows) {
        const schema = {};
        const sampleSize = Math.min(rows.length, 300);

        headers.forEach(header => {
            let numericHits = 0;
            let dateHits = 0;

            for (let i = 0; i < sampleSize; i++) {
                const val = rows[i][header];
                if (val !== null) {
                    if (!isNaN(Number(val))) numericHits++;
                    if (!isNaN(Date.parse(val)) && isNaN(val)) dateHits++;
                }
            }

            if (numericHits / sampleSize > 0.6) {
                schema[header] = 'numeric';
            } else if (dateHits / sampleSize > 0.6) {
                schema[header] = 'date';
            } else {
                schema[header] = 'categorical';
            }
        });

        return schema;
    }

    castDataset(rows, schema) {
        return rows.map(row => {
            const casted = {};
            Object.keys(row).forEach(key => {
                const type = schema[key];
                const raw = row[key];
                if (raw === null) {
                    casted[key] = null;
                } else if (type === 'numeric') {
                    casted[key] = Number(raw) || 0;
                } else if (type === 'date') {
                    casted[key] = new Date(raw);
                } else {
                    casted[key] = String(raw);
                }
            });
            return casted;
        });
    }
}
