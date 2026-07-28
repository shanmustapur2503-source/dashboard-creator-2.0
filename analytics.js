/**
 * Statistical Analytics & Insight Synthesis Engine
 */
class AnalyticsEngine {
    static computeKPIs(data, schema, stats) {
        const numericKeys = Object.keys(schema).filter(k => schema[k] === 'numeric');
        const categoricalKeys = Object.keys(schema).filter(k => schema[k] === 'categorical');

        const primaryNumeric = numericKeys[0] || null;
        const secondaryNumeric = numericKeys[1] || null;
        const primaryCategorical = categoricalKeys[0] || null;

        let totalVal = 0;
        let avgVal = 0;
        let maxVal = 0;
        let minVal = Infinity;

        if (primaryNumeric && data.length > 0) {
            totalVal = data.reduce((acc, r) => acc + (Number(r[primaryNumeric]) || 0), 0);
            avgVal = totalVal / data.length;
            maxVal = Math.max(...data.map(r => Number(r[primaryNumeric]) || 0));
            minVal = Math.min(...data.map(r => Number(r[primaryNumeric]) || 0));
        } else {
            minVal = 0;
        }

        // Top Category
        let topCategoryName = "N/A";
        if (primaryCategorical && primaryNumeric) {
            const agg = {};
            data.forEach(r => {
                const cat = r[primaryCategorical] || 'Unknown';
                agg[cat] = (agg[cat] || 0) + (Number(r[primaryNumeric]) || 0);
            });
            const sorted = Object.entries(agg).sort((a,b) => b[1] - a[1]);
            if (sorted.length > 0) topCategoryName = sorted[0][0];
        }

        return {
            totalRecords: stats.totalRows,
            primaryMetricName: primaryNumeric || 'Records',
            secondaryMetricName: secondaryNumeric || 'Secondary Metric',
            totalValue: totalVal,
            avgValue: avgVal,
            maxValue: maxVal,
            minValue: minVal,
            topCategory: topCategoryName,
            qualityScore: stats.qualityScore
        };
    }

    static generateExecutiveInsights(data, schema, kpis) {
        const insights = [];
        const numericKeys = Object.keys(schema).filter(k => schema[k] === 'numeric');
        const categoricalKeys = Object.keys(schema).filter(k => schema[k] === 'categorical');

        // Quality Insight
        if (kpis.qualityScore >= 90) {
            insights.push({
                type: 'success',
                title: 'High Data Integrity Detected',
                desc: `The dataset possesses a high completeness score of ${kpis.qualityScore}%. Automated model estimates carry higher confidence.`
            });
        } else {
            insights.push({
                type: 'warning',
                title: 'Data Hygiene Warning',
                desc: `Completeness index is at ${kpis.qualityScore}%. Missing fields were detected during ingestion.`
            });
        }

        // Leader insight
        if (categoricalKeys.length > 0 && numericKeys.length > 0) {
            insights.push({
                type: 'info',
                title: 'Dominant Category Leader',
                desc: `The segment **${kpis.topCategory}** represents the leading slice for metric **${kpis.primaryMetricName}**, recording a aggregate sum of $${kpis.totalValue.toLocaleString()}.`
            });
        }

        // Performance Distribution
        if (numericKeys.length > 0) {
            insights.push({
                type: 'info',
                title: 'Metric Dispersion & Range',
                desc: `Average observed level for **${kpis.primaryMetricName}** is **${kpis.avgValue.toFixed(2)}**, stretching from a minimum of ${kpis.minValue} to a peak of ${kpis.maxValue}.`
            });
        }

        return insights;
    }
}
