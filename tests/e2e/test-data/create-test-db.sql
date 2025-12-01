-- Test Database for E2E Testing
-- Creates FTS5 tables with sample genomic data for testing sqlite-search

-- Drop existing tables if they exist
DROP TABLE IF EXISTS genes_fts;
DROP TABLE IF EXISTS genes;
DROP TABLE IF EXISTS variants_fts;
DROP TABLE IF EXISTS variants;

-- =============================================================================
-- GENES TABLE AND FTS5
-- =============================================================================

-- Base table for genes
CREATE TABLE genes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    chromosome TEXT,
    description TEXT,
    aliases TEXT,
    omim_id TEXT,
    ensembl_id TEXT
);

-- Insert sample gene data
INSERT INTO genes (symbol, name, chromosome, description, aliases, omim_id, ensembl_id) VALUES
('BRCA1', 'BRCA1 DNA repair associated', '17', 'This gene encodes a nuclear phosphoprotein that plays a role in maintaining genomic stability and acts as a tumor suppressor.', 'IRIS, PSCP, BRCAI, BRCC1, FANCS, PNCA4, RNF53, BROVCA1, PPP1R53', '113705', 'ENSG00000012048'),
('BRCA2', 'BRCA2 DNA repair associated', '13', 'This gene encodes a protein that is involved in the repair of chromosomal damage with an important role in error-free repair of DNA double strand breaks.', 'FAD, FAD1, FACD, FANCD, BRCC2, FANCD1, XRCC11, BROVCA2', '600185', 'ENSG00000139618'),
('TP53', 'Tumor protein p53', '17', 'This gene encodes a tumor suppressor protein containing transcriptional activation, DNA binding, and oligomerization domains.', 'P53, BCC7, LFS1, TRP53', '191170', 'ENSG00000141510'),
('EGFR', 'Epidermal growth factor receptor', '7', 'The protein encoded by this gene is a transmembrane glycoprotein that is a member of the protein kinase superfamily.', 'ERBB, HER1, ERBB1, NISBD2, PIG61', '131550', 'ENSG00000146648'),
('KRAS', 'KRAS proto-oncogene, GTPase', '12', 'This gene encodes a protein that is a member of the small GTPase superfamily. A single amino acid substitution is responsible for an activating mutation.', 'KRAS1, KRAS2, RASK2, KI-RAS, C-K-RAS, K-RAS2A, K-RAS2B, K-RAS4A, K-RAS4B, NS3, CFC2, RALD, NS', '190070', 'ENSG00000133703'),
('PTEN', 'Phosphatase and tensin homolog', '10', 'This gene encodes a phosphatidylinositol-3,4,5-trisphosphate 3-phosphatase that negatively regulates AKT/PKB signaling.', 'BZS, DEC, CWS1, GLM2, MHAM, TEP1, MMAC1, PTEN1, 10q23del', '601728', 'ENSG00000171862'),
('APC', 'APC regulator of WNT signaling pathway', '5', 'This gene encodes a tumor suppressor protein that acts as an antagonist of the Wnt signaling pathway.', 'GS, DP2, DP3, BTPS2, DP2.5, PPP1R46', '611731', 'ENSG00000134982'),
('MLH1', 'MutL homolog 1', '3', 'This gene encodes a protein that plays a key role in DNA mismatch repair. Mutations cause Lynch syndrome.', 'COCA2, FCC2, hMLH1, HNPCC, HNPCC2', '120436', 'ENSG00000076242'),
('MSH2', 'MutS homolog 2', '2', 'This gene encodes a protein involved in DNA mismatch repair. Defects cause hereditary nonpolyposis colorectal cancer.', 'COCA1, FCC1, HNPCC, HNPCC1, LCFS2', '609309', 'ENSG00000095002'),
('ATM', 'ATM serine/threonine kinase', '11', 'The protein encoded by this gene belongs to the PI3/PI4-kinase family. This protein is an important cell cycle checkpoint kinase.', 'AT1, ATA, ATC, ATD, ATDC, ATE, TEL1, TELO1', '607585', 'ENSG00000149311');

-- Create FTS5 virtual table for genes
CREATE VIRTUAL TABLE genes_fts USING fts5(
    symbol,
    name,
    chromosome,
    description,
    aliases,
    omim_id,
    ensembl_id,
    content='genes',
    content_rowid='id'
);

-- Populate FTS5 table
INSERT INTO genes_fts(genes_fts) VALUES('rebuild');

-- =============================================================================
-- VARIANTS TABLE AND FTS5
-- =============================================================================

-- Base table for variants
CREATE TABLE variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gene_symbol TEXT NOT NULL,
    hgvs_c TEXT,
    hgvs_p TEXT,
    chromosome TEXT,
    position INTEGER,
    ref_allele TEXT,
    alt_allele TEXT,
    clinical_significance TEXT,
    review_status TEXT,
    condition TEXT,
    transcript_id TEXT
);

-- Insert sample variant data
INSERT INTO variants (gene_symbol, hgvs_c, hgvs_p, chromosome, position, ref_allele, alt_allele, clinical_significance, review_status, condition, transcript_id) VALUES
('BRCA1', 'c.68_69del', 'p.Glu23ValfsTer17', '17', 43124027, 'AG', 'A', 'Pathogenic', 'reviewed by expert panel', 'Hereditary breast and ovarian cancer syndrome', 'NM_007294.4'),
('BRCA1', 'c.181T>G', 'p.Cys61Gly', '17', 43106487, 'T', 'G', 'Pathogenic', 'criteria provided, multiple submitters', 'Hereditary cancer-predisposing syndrome', 'NM_007294.4'),
('BRCA1', 'c.5266dupC', 'p.Gln1756ProfsTer74', '17', 43057062, 'C', 'CC', 'Pathogenic', 'reviewed by expert panel', 'Hereditary breast and ovarian cancer syndrome', 'NM_007294.4'),
('BRCA2', 'c.5946del', 'p.Ser1982ArgfsTer22', '13', 32913836, 'CT', 'C', 'Pathogenic', 'reviewed by expert panel', 'Hereditary breast and ovarian cancer syndrome', 'NM_000059.4'),
('BRCA2', 'c.6275_6276del', 'p.Leu2092ProfsTer7', '13', 32914137, 'TT', 'T', 'Pathogenic', 'criteria provided, multiple submitters', 'Hereditary cancer-predisposing syndrome', 'NM_000059.4'),
('TP53', 'c.743G>A', 'p.Arg248Gln', '17', 7673803, 'G', 'A', 'Pathogenic', 'criteria provided, multiple submitters', 'Li-Fraumeni syndrome', 'NM_000546.6'),
('TP53', 'c.818G>A', 'p.Arg273His', '17', 7673781, 'G', 'A', 'Pathogenic', 'criteria provided, multiple submitters', 'Li-Fraumeni syndrome', 'NM_000546.6'),
('EGFR', 'c.2573T>G', 'p.Leu858Arg', '7', 55259515, 'T', 'G', 'Pathogenic', 'criteria provided, single submitter', 'Non-small cell lung cancer', 'NM_005228.5'),
('EGFR', 'c.2369C>T', 'p.Thr790Met', '7', 55249071, 'C', 'T', 'Drug response', 'criteria provided, multiple submitters', 'EGFR-related lung cancer', 'NM_005228.5'),
('KRAS', 'c.35G>T', 'p.Gly12Val', '12', 25245350, 'C', 'A', 'Pathogenic', 'criteria provided, multiple submitters', 'Colorectal cancer', 'NM_004985.5'),
('KRAS', 'c.35G>A', 'p.Gly12Asp', '12', 25245350, 'C', 'T', 'Pathogenic', 'criteria provided, multiple submitters', 'Lung adenocarcinoma', 'NM_004985.5'),
('PTEN', 'c.388C>T', 'p.Arg130Ter', '10', 87933147, 'C', 'T', 'Pathogenic', 'criteria provided, multiple submitters', 'Cowden syndrome', 'NM_000314.8'),
('APC', 'c.3927_3931del', 'p.Glu1309AspfsTer4', '5', 112839514, 'AAAGA', 'A', 'Pathogenic', 'reviewed by expert panel', 'Familial adenomatous polyposis', 'NM_000038.6'),
('MLH1', 'c.676C>T', 'p.Arg226Ter', '3', 37050340, 'C', 'T', 'Pathogenic', 'reviewed by expert panel', 'Lynch syndrome', 'NM_000249.4'),
('MSH2', 'c.942+3A>T', NULL, '2', 47630507, 'A', 'T', 'Pathogenic', 'criteria provided, multiple submitters', 'Lynch syndrome', 'NM_000251.3');

-- Create FTS5 virtual table for variants
CREATE VIRTUAL TABLE variants_fts USING fts5(
    gene_symbol,
    hgvs_c,
    hgvs_p,
    chromosome,
    position,
    ref_allele,
    alt_allele,
    clinical_significance,
    review_status,
    condition,
    transcript_id,
    content='variants',
    content_rowid='id'
);

-- Populate FTS5 table
INSERT INTO variants_fts(variants_fts) VALUES('rebuild');

-- =============================================================================
-- VERIFY DATA
-- =============================================================================

-- Show counts
SELECT 'genes' as table_name, COUNT(*) as count FROM genes
UNION ALL
SELECT 'genes_fts', COUNT(*) FROM genes_fts
UNION ALL
SELECT 'variants', COUNT(*) FROM variants
UNION ALL
SELECT 'variants_fts', COUNT(*) FROM variants_fts;
