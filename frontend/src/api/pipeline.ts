const API_BASE = "/api";

export async function getCapabilities(): Promise<{ fasttree_available: boolean }> {
  const res = await fetch(`${API_BASE}/capabilities`);
  if (!res.ok) return { fasttree_available: false };
  return res.json();
}

export async function startPipeline(
  fwdFile: File,
  revFile: File,
  ncbiEmail: string,
  blastDb: string = "16S_ribosomal_RNA",
  treeMethod: string = "nj"
): Promise<{ job_id: string }> {
  const form = new FormData();
  form.append("fwd", fwdFile);
  form.append("rev", revFile);
  form.append("ncbi_email", ncbiEmail);
  form.append("blast_db", blastDb);
  form.append("tree_method", treeMethod);

  const res = await fetch(`${API_BASE}/run`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Pipeline start failed: ${res.statusText}`);
  return res.json();
}

export async function getResults(jobId: string) {
  const res = await fetch(`${API_BASE}/results/${jobId}`);
  if (!res.ok) throw new Error(`Failed to fetch results: ${res.statusText}`);
  return res.json();
}

export async function predictStructure(
  jobId: string
): Promise<{ protein_sequence: string; pdb: string }> {
  const res = await fetch(`${API_BASE}/structure/${jobId}`, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Structure prediction failed: ${res.statusText}`);
  }
  return res.json();
}
