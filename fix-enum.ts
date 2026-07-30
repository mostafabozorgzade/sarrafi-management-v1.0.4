import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://root:lspCJAAr8QDCfFxtcPKcEyvd@rainier.liara.cloud:30561/sarrafix'
  });
  await client.connect();

  const statuses = await client.query('SELECT DISTINCT status::text FROM orders');
  console.log('Current order statuses:', statuses.rows);

  const mapping: Record<string, string> = {
    'DRAFT': 'IN_PROGRESS',
    'REGISTERED': 'IN_PROGRESS',
    'TOMAN_RECEIVED': 'IN_PROGRESS',
    'AWAITING_PKR_TRANSFER': 'IN_PROGRESS',
    'PKR_TRANSFERRED': 'COMPLETED',
  };

  for (const [oldVal, newVal] of Object.entries(mapping)) {
    const result = await client.query(
      `UPDATE orders SET status = $1::\"OrderStatus\" WHERE status = $2::\"OrderStatus\"`,
      [newVal, oldVal]
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log(`Updated ${result.rowCount} rows from ${oldVal} to ${newVal}`);
    }
  }

  const remaining = await client.query('SELECT DISTINCT status::text FROM orders');
  console.log('Remaining statuses:', remaining.rows);

  await client.end();
}

main().catch(console.error);
