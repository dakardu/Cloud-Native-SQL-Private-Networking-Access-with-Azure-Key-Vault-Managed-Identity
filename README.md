# 🧠 Cloud-Native SQL Private Networking Access

### with Azure Key Vault & Managed Identity

## 🎯 Objetivo

This project demonstrates a secure, cloud-native architecture for accessing a SQL Server deployed on an Azure Virtual Machine using private networking, data access via a Node.js REST API, Azure Key Vault for secrets management, and Managed Identity for secure, credential-free authentication.

---

## 🏗 Arquitectura

![Arquitectura del proyecto](images/architecture.png)

---

## 🔐 Seguridad aplicada

- Sin acceso público a SQL Server
- Acceso solo mediante red privada (VNet)
- Credenciales almacenadas en Key Vault
- Acceso mediante Managed Identity
- NSG controlando tráfico

---

## ☁️ Infraestructura Azure

### Resource Groups

- rg-dp300-lab (Esat US)
- rg-dp300-client (Spain Central)

### Redes

- vnet-dp300 (10.0.0.0/16)

![Redes y subredes](images/vnet-subnets.png)

- vnet-client (10.1.1.0/16) ✔ VNet Peering entre ambas

![Redes y subredes cliente](images/vnet-subnets-client.png)

- Realizamos un peering entre las dos VNETs para tener conectividad entre las dos Vnets

![Emparejamiento de redes (Vnets)](images/peering-netwoks.png)

---

### NSG (nsg-dp300)

| Regla                    | Origen                | Puerto | Acción |
| ------------------------ | --------------------- | ------ | ------ |
| Allow-SQL-from-AppSubnet | 10.0.20.0/24          | 1433   | Allow  |
| Allow-SQL-from-Client    | IP pública VM cliente | 1433   | Allow  |
| Allow-RDP-admin          | IP administrador      | 3389   | Allow  |

---

### Máquinas virtuales

- VM-ServerDP300 → SQL Server
- vm-client-eu → cliente / API

---

## 🔁 Flujo de conectividad

PC Local → RDP → VM Cliente (Europa) → SSMS → SQL Server (10.0.10.4)

![conectividad a la SQL DB desde la VM eu](images/conexionVM_to_SQL-DB.png)

---

## 🗄️ SQL Server (IaaS)

- IP privada: 10.0.10.4
- Puerto: 1433
- Autenticación: SQL Authentication
- Usuario: sqladmin
- Base de datos inicial: AdventureWorksLT o default

- Conectividad privada dentro de la VNet
- Sin exposición directa a internet
- Acceso restringido mediante NSG

## 🧪 Validación de conectividad

```powershell
Test-NetConnection 10.0.10.4 -Port 1433
```

Resultado esperado:

```
TcpTestSucceeded : True
```

---

## 🗄 Base de datos

Motor: SQL Server 2022\
Base de datos: training

### Tablas:

- Users
- Courses
- UserCourses

Incluye: - campo password en usuarios - tipo de curso (free/paid)

![Creamos la DB y las estrcuctura de tablas](images/database-tablas.png)

![Insertamos valosres](images/insertamos-valores.png)

![Realizamos selects con joins](images/selects-joins.png)

## 💾 Backup

```sql
BACKUP DATABASE training
TO DISK = 'C:\backup\training.bak'
WITH FORMAT,
MEDIANAME = 'training_backup',
NAME = 'Full Backup of training DB';
```

- El backup lo realizamos desde la VM SQL Server
- Antes de realizar el backup debemos buscar el usuario NT SERVICE\MSSQLSERVER y darle permisos en carpeta

![Realizamos el backup](images/backupDB.png)

---

## ⚙️ API REST Node.js

Tecnologías: - Node.js - Express - MSSQL - Azure Identity - Azure
KeyVault SDK

- Creamos el directorio donde vamos a alojar la api

![Directorio donde creamos la api](images/crear-directorio.png)

- Instalamos NodeJS

![Instalamos NodeJS](images/install-nodeJS.png)

- Instalamos las dependencias para NodeJS

![dependencias para NodeJS](images/dependencias-nodeJS.png)

- Creamos la api

![Creamos la api](images/creamos-la-api.png)

### Endpoints

- GET /
- GET /users
- GET /users/id
- POST /users

- Primero realizamos la conexion con un archivo .ENV y llamado a dotenv desde app.js

![connexion con la DB y encabezados](images/conexion-encabezados-app.png)

![Endpoints en de la app](images/endpoints.png)

![Archivo .ENV](images/env.png)

- Realizamos test con Thunder Client a los enpoints

![Visualizamos los usuarios](images/ver-users.png)

![Crear usuario](images/crear-user.png)

---

## 🔐 Azure Key Vault

Vault: kv-dp300-lab

![Creamos el Key Vault](images/key-vault.png)

Secrets: - db-user - db-password - db-server - db-name

![Configuramos los secretos](images/secretos.png)

---

## 🔐 RBAC y control de acceso

### Usuario administrador (Xlab-o1m-276)

Rol: Key Vault Secrets Officer  
Permisos:

✔ Crear secretos
✔ Modificar secretos
✔ Borrar secretos
✔ Listarlos

- Buscamos este ROL en el apartado IAM del KeyVault y se lo añadimos al usuario

![Rol de usuario](images/IAM-user-rol.png)

👉 Este rol se usa únicamente para gestión del Key Vault.

## 🪪 Managed Identity de la VM

VM: VM-ServerDP300\
Rol: Key Vault Secrets User
Permisos:

✔ Obtener secretos (GET)
✔ Listar secretos

👉 Este rol permite a la aplicación acceder a los secretos sin usar credenciales.

- Buscamos este rol y se lo añadimos a la VM-ServerDP300

![Rol para la VM DB Server](images/rol-VM-ServerDB.png)

- Despues en la VM-ServerDP300 => Security => Identity => System Assigned Activamos
  el status a ON y guardamos

![Activar Identity en la VM-ServerDP300](images/vm-identity-db-server.png)

---

## 🔌 Conexión Key Vault

- Autentícame en Azure usando la identidad de la VM y tráeme el secreto db-password desde Key Vault

- Instalamos las varibles desde la libreria SDK de Azure

```bash
npm install @azure/identity @azure/keyvault-secrets

```

```js
const { DefaultAzureCredential } = require("@azure/identity");
```

- Es la librería del SDK que permite autenticarse con Azure:
  👉 Esto usa:
    - Managed Identity
    - Azure CLI login
    - Visual Studio login
    - Environment variables

```js
const { SecretClient } = require("@azure/keyvault-secrets");
```

- Es la librería para conectarte a Key Vault:
  👉 Esto se usa:
    - 🔐 Obtener secretos desde Azure Key Vault
        - Credenciales de base de datos
        - Connection strings
        - API keys
        - Tokens

---

## 🔌 Conexión SQL

```js
const config = {
	user: secrets.user,
	password: secrets.password,
	server: secrets.server,
	database: secrets.database,
};
```

- Configuraciones de autenticacion en config.js

![Autencicacion con el SDK de Azure](images/config.png)

- Conexiones con la DB y el resto del contenisdo de app.js

![Conexion DB y enpoints en app.js](images/config.png)

## 🧪 Pruebas

- Thunder Client
- curl

✔ Respuestas 200 OK\
✔ Inserción correcta en DB

- Ya conectados con el KeyVault podemos ver que sigue en funcionamiento la API

![Creamos un usuario](images/crear-user-keyvault.png)

![Visualizamos usuario](images/ver-users-keyvault.png)

---

## 🔄 Flujo de autenticación seguro

1. La API Node.js se ejecuta dentro de la VM cliente
2. La VM utiliza su Managed Identity
3. Azure AD valida la identidad automáticamente
4. La API obtiene los secretos desde Azure Key Vault
5. Se establece conexión segura con SQL Server

---

## 📢 Key Skills Demonstrated

- Azure Networking (VNet, Peering, NSG)
- Azure Key Vault
- Managed Identity
- Secure SQL Server on IaaS
- REST API development (Node.js)
- RBAC & IAM in Azure
- Private cloud architectures

---

## 🔐 Security Notes

No credentials are stored in this repository.
All secrets are managed securely through Azure Key Vault and accessed using Managed Identity.
Any values used during this lab were temporary and have been destroyed.

---

## 🚀 Mejoras futuras

- Terraform
- CI/CD
- JWT Auth
- Azure App Service

---

## 👨‍💻 Autor

Dagoberto Duran Montoya
