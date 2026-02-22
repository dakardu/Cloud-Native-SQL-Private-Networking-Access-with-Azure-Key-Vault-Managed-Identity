const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

const keyVaultName = "kv-dp300-lab";
const url = `https://${keyVaultName}.vault.azure.net`;

const credential = new DefaultAzureCredential();
const client = new SecretClient(url, credential);

async function getSecrets() {
    const dbUser = await client.getSecret("db-user");
    const dbPassword = await client.getSecret("db-password");
    const dbServer = await client.getSecret("db-server");
    const dbName = await client.getSecret("db-name");

    return {
        user: dbUser.value,
        password: dbPassword.value,
        server: dbServer.value,
        database: dbName.value
    };
}

module.exports = getSecrets;
