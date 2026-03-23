const API_BASE = "/api";

export async function startPipeline(
  fwdFile: File,
  revFile: File,
  ncbiEmail: string
): Promise<{ job_id: string }> {
  const form = new FormData();
  form.append("fwd", fwdFile);
  form.append("rev", revFile);
  form.append("ncbi_email", ncbiEmail);

  const res = await fetch(`${API_BASE}/run`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Pipeline start failed: ${res.statusText}`);
  return res.json();
}

export async function getResults(jobId: string) {
  const res = await fetch(`${API_BASE}/results/${jobId}`);
  if (!res.ok) throw new Error(`Failed to fetch results: ${res.statusText}`);
  return res.json();
}
