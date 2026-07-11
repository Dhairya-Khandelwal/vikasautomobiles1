/* Master Report and Data Exporter Tool - Vikas Automobiles */

const EXPORTER = {
  // Safe CSV Builder and Browser Trigger
  downloadCSV: (filename, data) => {
    if (!data || data.length === 0) {
      window.UTILS.showToast("No data record entries available to export.", "warning");
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add UTF-8 BOM so Excel opens non-ASCII characters correctly
    csvRows.push("\ufeff" + headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const strVal = val === null || val === undefined ? "" : String(val);
        return `"${strVal.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`; // Clean newlines to prevent row breakages
      });
      csvRows.push(values.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // 1. REGISTRATION DATA EXPORTER
  exportRegistrationData: async () => {
    try {
      const users = await window.API.getUsers();
      const mapped = users.map(u => ({
        "Date & Time": u.regDate ? window.UTILS.formatDate(u.regDate) : "-",
        "Name": u.fullname || "-",
        "User Type": u.role || "-",
        "Firm Name": u.firmName || "-",
        "Approval": u.status === "approved" ? "Approved" : (u.status === "pending" ? "Pending" : "Rejected"),
        "Email Id": u.email || "-",
        "Mobile No": u.mobile || "-",
        "Password": u.password || "-",
        "Points": u.points || 0,
        "User Id": u.userId || "-",
        "Last Login": u.lastLogin ? window.UTILS.formatDate(u.lastLogin) : "-",
        "Status": u.status || "-"
      }));
      EXPORTER.downloadCSV("Registration_Data.csv", mapped);
    } catch (e) {
      window.UTILS.showToast("Failed to compile registration data report.", "error");
    }
  },

  // 2. PRODUCT DETAILS EXPORTER
  exportProductDetails: async () => {
    try {
      const products = await window.API.getProducts();
      const mapped = products.map(p => ({
        "id": p.id,
        "name": p.name,
        "packSize": p.packSize || "1 Unit",
        "QR Code": p.id,
        "retailerPrice": p.retailerPrice || 0,
        "mechanicPrice": p.mechanicPrice || 0,
        "retailerPoints": p.retailerPoints || 0,
        "mechanicPoints": p.mechanicPoints || 0
      }));
      EXPORTER.downloadCSV("Product_Details.csv", mapped);
    } catch (e) {
      window.UTILS.showToast("Failed to compile products catalog report.", "error");
    }
  },

  // 3. PURCHASE REQUESTS EXPORTER
  exportPurchaseRequests: async () => {
    try {
      const purchases = await window.API.getPurchases();
      const users = await window.API.getUsers();
      const products = await window.API.getProducts();

      const mapped = purchases.map(c => {
        const user = users.find(u => u.email.toLowerCase() === c.email.toLowerCase());
        const prod = products.find(p => p.id === c.productID);
        
        let packSize = "-";
        let price = 0;
        if (c.productID === "RED-CASH") {
          packSize = "Cash Payout";
        } else if (prod) {
          packSize = prod.packSize || "1 Unit";
          price = c.role === "retailer" ? (prod.retailerPrice || 0) : (prod.mechanicPrice || 0);
        }
        
        const amount = price * c.quantity;

        return {
          "Request ID": c.id,
          "User ID": user ? user.userId : "-",
          "Name": c.fullname,
          "User Type": c.role,
          "Product ID": c.productID,
          "Product Name": c.productName,
          "Pack Size": packSize,
          "Quantity": c.quantity,
          "Amount": amount || 0,
          "Status": c.status,
          "Submitted At": c.date ? window.UTILS.formatDate(c.date) : "-"
        };
      });
      EXPORTER.downloadCSV("Purchase_Requests.csv", mapped);
    } catch (e) {
      window.UTILS.showToast("Failed to compile purchase requests report.", "error");
    }
  },

  // 4. PURCHASE HISTORY EXPORTER
  exportPurchaseHistory: async () => {
    try {
      const purchases = await window.API.getPurchases();
      const users = await window.API.getUsers();
      const products = await window.API.getProducts();

      // Only approved physical products count as sales/purchase history
      const approved = purchases.filter(c => c.status === "approved" && c.productID !== "RED-CASH");

      const mapped = approved.map(c => {
        const user = users.find(u => u.email.toLowerCase() === c.email.toLowerCase());
        const prod = products.find(p => p.id === c.productID);
        
        let price = 0;
        if (prod) {
          price = c.role === "retailer" ? (prod.retailerPrice || 0) : (prod.mechanicPrice || 0);
        }
        const amount = price * c.quantity;

        return {
          "Purchase ID": c.purchaseID || `PCH-${c.id.replace("C-", "")}`,
          "Request ID": c.id,
          "User ID": user ? user.userId : "-",
          "Name": c.fullname,
          "Product": c.productName,
          "Quantity": c.quantity,
          "Amount": amount || 0,
          "Points Awarded": c.pointsCalculated,
          "Approved By": c.approvedBy || "System Auto",
          "Approved Date": c.approvedDate ? window.UTILS.formatDate(c.approvedDate) : (c.date ? window.UTILS.formatDate(c.date) : "-")
        };
      });
      EXPORTER.downloadCSV("Purchase_History.csv", mapped);
    } catch (e) {
      window.UTILS.showToast("Failed to compile purchase history report.", "error");
    }
  },

  // 5. POINTS LEDGER EXPORTER
  exportPointsLedger: async () => {
    try {
      const purchases = await window.API.getPurchases();
      const users = await window.API.getUsers();

      const userTransactions = {};
      users.forEach(u => {
        userTransactions[u.email.toLowerCase()] = [];
      });

      // Add credits (approved purchase claims)
      const credits = purchases.filter(c => c.status === "approved" && c.productID !== "RED-CASH");
      credits.forEach(c => {
        const emailKey = c.email.toLowerCase();
        if (!userTransactions[emailKey]) userTransactions[emailKey] = [];
        userTransactions[emailKey].push({
          date: c.approvedDate || c.date,
          type: "CREDIT",
          points: c.pointsCalculated,
          remark: `Claim Approved: ${c.productName}${c.remark ? ' - ' + c.remark : ''}`,
          fullname: c.fullname
        });
      });

      // Add debits (redemptions)
      const debits = purchases.filter(c => c.productID === "RED-CASH");
      debits.forEach(c => {
        const emailKey = c.email.toLowerCase();
        if (!userTransactions[emailKey]) userTransactions[emailKey] = [];
        userTransactions[emailKey].push({
          date: c.date,
          type: "DEBIT",
          points: c.pointsCalculated, // this is already a negative points value
          remark: `Redemption: ${c.productName}${c.remark ? ' - ' + c.remark : ''}`,
          fullname: c.fullname
        });
      });

      const finalLedger = [];
      users.forEach(u => {
        const emailKey = u.email.toLowerCase();
        const txs = userTransactions[emailKey] || [];
        // Sort chronologically oldest first for balance calculations
        txs.sort((a, b) => new Date(a.date) - new Date(b.date));

        let balance = 0;
        txs.forEach(tx => {
          balance += tx.points;
          finalLedger.push({
            "Date": tx.date ? window.UTILS.formatDate(tx.date) : "-",
            "User ID": u.userId,
            "Name": tx.fullname || u.fullname,
            "Transaction Type": tx.type,
            "Points": tx.points,
            "Balance": balance,
            "Remarks": tx.remark
          });
        });
      });

      // Sort final ledger descending (newest entries first)
      finalLedger.sort((a, b) => new Date(b.Date) - new Date(a.Date));
      EXPORTER.downloadCSV("Points_Ledger.csv", finalLedger);
    } catch (e) {
      window.UTILS.showToast("Failed to compile points ledger report.", "error");
    }
  },

  // 6. ADMIN USERS DATA EXPORTER
  exportAdminUsersData: async () => {
    try {
      const users = await window.API.getUsers();
      const admins = users.filter(u => u.role === "admin" || u.role === "owner");
      const mapped = admins.map(u => ({
        "User ID": u.userId || "-",
        "Name": u.fullname || "-",
        "Role": u.role || "-",
        "Email": u.email || "-",
        "Mobile": u.mobile || "-",
        "Password": u.password || "-",
        "Status": u.status || "-"
      }));
      EXPORTER.downloadCSV("Admin_Users_Data.csv", mapped);
    } catch (e) {
      window.UTILS.showToast("Failed to compile admin users directory report.", "error");
    }
  },

  // 7. OTP LOGS EXPORTER
  exportOtpLogs: async () => {
    try {
      const otpLogs = await window.API.getOtpLogs();
      const mapped = otpLogs.map(o => ({
        "Date & Time": o.timestamp ? window.UTILS.formatDate(o.timestamp) : "-",
        "Mobile": o.mobile || "-",
        "Email": o.email || "-",
        "OTP": o.otp || "-",
        "Status": o.status || "-",
        "Used At": o.usedAt && o.usedAt !== "-" ? window.UTILS.formatDate(o.usedAt) : "-"
      }));
      EXPORTER.downloadCSV("OTP_Logs.csv", mapped);
    } catch (e) {
      window.UTILS.showToast("Failed to compile OTP verification logs report.", "error");
    }
  },

  // 8. SYSTEM LOGS EXPORTER
  exportSystemLogs: async () => {
    try {
      const logs = await window.API.getLogs();
      const mapped = logs.map(l => ({
        "Date & Time": l.timestamp ? window.UTILS.formatDate(l.timestamp) : "-",
        "User ID": l.userId || "SYSTEM",
        "User": l.user || "SYSTEM",
        "Action": l.action || "-",
        "Module": l.module || "SYSTEM",
        "Remark": l.remark || "-"
      }));
      EXPORTER.downloadCSV("System_Logs.csv", mapped);
    } catch (e) {
      window.UTILS.showToast("Failed to compile security system audit logs report.", "error");
    }
  },

  // MASTER SALES COMBINED EXCEL REPORT
  exportCombinedSalesReport: async () => {
    try {
      const purchases = await window.API.getPurchases();
      const users = await window.API.getUsers();
      const products = await window.API.getProducts();

      // Master sales record (approved claims)
      const approvedClaims = purchases.filter(c => c.status === "approved" && c.productID !== "RED-CASH");
      
      const mapped = approvedClaims.map(c => {
        const user = users.find(u => u.email.toLowerCase() === c.email.toLowerCase());
        const prod = products.find(p => p.id === c.productID);
        
        let price = 0;
        let packSize = "-";
        if (prod) {
          packSize = prod.packSize || "1 Unit";
          price = c.role === "retailer" ? (prod.retailerPrice || 0) : (prod.mechanicPrice || 0);
        }
        const amount = price * c.quantity;

        return {
          "Invoice Date": c.approvedDate ? window.UTILS.formatDate(c.approvedDate) : (c.date ? window.UTILS.formatDate(c.date) : "-"),
          "Purchase ID": c.purchaseID || `PCH-${c.id.replace("C-", "")}`,
          "Claim Request ID": c.id,
          "Partner ID": user ? user.userId : "-",
          "Partner Name": c.fullname,
          "Partner Role": c.role.toUpperCase(),
          "Firm Name": c.firmName || "-",
          "Mobile": user ? user.mobile : "-",
          "Product ID": c.productID,
          "Product Name": c.productName,
          "Pack Size": packSize,
          "Quantity Scanned": c.quantity,
          "Unit Price (INR)": price,
          "Sales Amount (INR)": amount,
          "Loyalty Points Issued": c.pointsCalculated,
          "Approved By": c.approvedBy || "System Auto",
          "Remarks": c.remark || "-"
        };
      });

      EXPORTER.downloadCSV("Master_Sales_Revenue_Report.csv", mapped);
    } catch (e) {
      window.UTILS.showToast("Failed to compile master sales report.", "error");
    }
  }
};

window.EXPORTER = EXPORTER;
