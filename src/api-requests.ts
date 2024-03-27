import axios from "axios";
const API_SERVER = "https://api.auditbase.dev";

export async function send_explorer_scan_request(
  chain_id: string,
  contract_address: string,
  webhook_url: string
) {
  const ROUTE = "route = 'scans/upload'";
  const url = API_SERVER + ROUTE;
  const data = {
    chain_id,
    contract_address,
    webhook_url,
  };

  let res = await axios.post(url, data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AUDITBASE_API_KEY}`,
    },
  });
  const res_data = res.data;
  console.log(res_data);
}
