const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const { rx, rep } of replacements) {
        content = content.replace(rx, rep);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

const dir = path.join(__dirname, 'src', 'features');
const folders = fs.readdirSync(dir);

for (const folder of folders) {
    const fPath = path.join(dir, folder);
    if (!fs.statSync(fPath).isDirectory()) continue;
    
    const files = fs.readdirSync(fPath);
    for (const file of files) {
        if (file.endsWith('.controller.ts') || file.endsWith('webhook.ts') || file.endsWith('service.ts')) {
            const p = path.join(fPath, file);
            replaceInFile(p, [
                { rx: /req\.params\.id/g, rep: "(req.params.id as string)" },
                { rx: /req\.params\.slug/g, rep: "(req.params.slug as string)" },
                { rx: /req\.params\.productId/g, rep: "(req.params.productId as string)" },
                { rx: /let event: Stripe.Event;/g, rep: "let event: any;" },
                { rx: /Stripe.Checkout.Session/g, rep: "any" },
                { rx: /Stripe.PaymentIntent/g, rep: "any" },
                { rx: /event\.type/g, rep: "event.type" }
            ]);
        }
    }
}
