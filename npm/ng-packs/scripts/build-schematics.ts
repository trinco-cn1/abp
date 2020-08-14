import execa from 'execa';
import fse from 'fs-extra';

class FileCopy {
  src: string;
  dest: string;
  options?: fse.CopyOptions;

  constructor(filecopyOrSrc: FileCopy | string) {
    if (typeof filecopyOrSrc === 'string') {
      this.src = filecopyOrSrc;
      this.dest = filecopyOrSrc;
    } else {
      this.src = filecopyOrSrc.src;
      this.dest = filecopyOrSrc.dest;
      this.options = filecopyOrSrc.options;
    }
  }
}

const PACKAGE_TO_BUILD = 'schematics';
const FILES_TO_COPY_AFTER_BUILD: (FileCopy | string)[] = [
  { src: 'src/commands/proxy/files-enum', dest: 'commands/proxy/files-enum' },
  { src: 'src/commands/proxy/files-model', dest: 'commands/proxy/files-model' },
  { src: 'src/commands/proxy/files-service', dest: 'commands/proxy/files-service' },
  { src: 'src/commands/proxy/schema.json', dest: 'commands/proxy/schema.json' },
  { src: 'src/collection.json', dest: 'collection.json' },
  'package.json',
  'README.md',
];

async function* copyPackageFile(packageName: string, filecopy: FileCopy | string) {
  filecopy = new FileCopy(filecopy);
  const { src, dest, options = { overwrite: true } } = filecopy;

  await fse.copy(`../packages/${packageName}/${src}`, `../dist/${packageName}/${dest}`, options);

  yield filecopy;
}

async function* copyPackageFiles(packageName: string) {
  for (const filecopy of FILES_TO_COPY_AFTER_BUILD) {
    yield* copyPackageFile(packageName, filecopy);
  }
}

(async () => {
  await fse.remove(`../dist/${PACKAGE_TO_BUILD}`);

  await execa(
    'tsc',
    ['-p', `packages/${PACKAGE_TO_BUILD}/tsconfig.json`, '--outDir', `dist/${PACKAGE_TO_BUILD}`],
    {
      stdout: 'inherit',
      cwd: '../',
    },
  );

  for await (const filecopy of copyPackageFiles(PACKAGE_TO_BUILD)) {
    // do nothing
  }
})();
