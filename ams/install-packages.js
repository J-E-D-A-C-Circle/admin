/**
 * Custom package downloader using plain HTTP (bypasses TLS cipher issue).
 * Downloads tarballs from npmmirror.com via HTTP and installs them manually.
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const MIRROR = 'registry.npmmirror.com';
const PACKAGES = [
  'drizzle-orm',
  'mysql2',
  'jsonwebtoken',
  'bcryptjs',
  'lucide-react',
  'recharts',
  'react-hook-form',
  '@hookform/resolvers',
  'clsx',
  'tailwind-merge',
  'drizzle-kit',
  '@types/jsonwebtoken',
  '@types/bcryptjs',
];

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('https')) {
          // Downgrade to http for the actual tarball download if it's on the same mirror
          if (redirectUrl.includes(MIRROR)) {
            redirectUrl = redirectUrl.replace('https://', 'http://');
          }
        }
        return resolve(httpGet(redirectUrl));
      }
      
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

async function getPackageInfo(pkg) {
  const encodedPkg = pkg.replace('/', '%2F');
  const url = `http://${MIRROR}/${encodedPkg}`;
  console.log(`  Fetching metadata for ${pkg}...`);
  const { data } = await httpGet(url);
  return JSON.parse(data.toString());
}

async function downloadTarball(tarballUrl, dest) {
  // Force HTTP for tarball downloads
  const httpUrl = tarballUrl.replace('https://', 'http://');
  console.log(`  Downloading ${path.basename(dest)}...`);
  const { data } = await httpGet(httpUrl);
  fs.writeFileSync(dest, data);
}

async function installPackage(pkg) {
  try {
    const info = await getPackageInfo(pkg);
    const latest = info['dist-tags']?.latest;
    if (!latest) throw new Error('No latest version found');
    
    const version = info.versions[latest];
    const tarballUrl = version.dist.tarball;
    
    const tmpDir = os.tmpdir();
    const tgzName = `${pkg.replace('/', '__')}-${latest}.tgz`;
    const tgzPath = path.join(tmpDir, tgzName);
    
    await downloadTarball(tarballUrl, tgzPath);
    
    // Use npm to install from local tarball
    const pkgDir = path.join('node_modules', pkg.includes('/') ? pkg.split('/')[0] : pkg);
    const cmd = `npm install ${tgzPath} --no-save --legacy-peer-deps --prefer-offline --strict-ssl false 2>&1`;
    console.log(`  Installing ${pkg}@${latest}...`);
    execSync(cmd, { stdio: 'pipe' });
    console.log(`  ✅ ${pkg}@${latest}`);
    
    // Cleanup
    fs.unlinkSync(tgzPath);
  } catch (err) {
    console.error(`  ❌ Failed ${pkg}: ${err.message}`);
  }
}

async function main() {
  console.log('🔧 Installing packages via HTTP mirror...\n');
  
  for (const pkg of PACKAGES) {
    await installPackage(pkg);
  }
  
  console.log('\n✅ Done. Run "npm ls" to verify installation.');
}

main().catch(console.error);
