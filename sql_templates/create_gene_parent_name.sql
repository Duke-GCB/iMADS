
update hg19.gene as g1 set parent_name = (
  select max(name)
  from hg19.gene as g2
  where g2.gene_list = g1.gene_list
  and g2.common_name = g1.common_name
  and g2.chrom = g1.chrom
  and g2.strand = g1.strand
  and g2.txstart = g1.txstart
  and g2.txend = g1.txend);