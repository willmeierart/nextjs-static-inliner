const find = require('find')
const fs = require('fs')
const file = require('file')

let newFileName = 'smc_lp_02.html'
MSify(newFileName)


function MSify (newFileName, sourceFileNamePlusParentDir) {
  const headTagFinder = /\<link rel="preload(.*?)as="script"\/\>/g
  const scriptFinder = /(<script async="" id="__NEXT_PAGE|<script src="\/_next)([^;]*?)\>\<\/script\>/g
  const srcFinder = /(?<=src="\/).*?(?=")/

  const outputDir = 'missionsuiteready'
  const msHTMLfile = 'HEAD_SCRIPTS.html'
  // const safeDirname = file.path.abspath(__dirname)

  let transformedFileTxt = ''

  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  const writeNewFile = async () => {
    const outputFolderAbsPath = file.path.join(__dirname, outputDir)
    const outputFileAbsPath = file.path.join(outputFolderAbsPath, newFileName).replace(' ', '\ ')
    if (!fs.existsSync(outputFolderAbsPath)) {
      try {
        await fs.mkdirSync(outputFolderAbsPath)
        fs.writeFileSync(outputFileAbsPath, transformedFileTxt)
      } catch (e) { console.log(e) }
    } else {
      if (fs.existsSync(outputFileAbsPath)) {
        try {
          await fs.unlinkSync(outputFileAbsPath)
        } catch (e) {
          console.log(e)
        }
      }
      try {
        fs.writeFileSync(outputFileAbsPath, transformedFileTxt)
      } catch (e) {
        console.log(e)
      }
    }
  }

  const handleExtraTagsFor = async () => {
    // add missionsuite specific html
    find.file(msHTMLfile, __dirname, htmlFiles => {
      if (htmlFiles.length > 0) {
        const htmlHeadFile = htmlFiles.pop()
        fs.readFile(htmlHeadFile, 'utf8', (err, htmlHeadContent) => {
          if (err) {
            console.log(err)
          } else {
            transformedFileTxt = transformedFileTxt.replace('</head>', `${htmlHeadContent}</head>`)
            writeNewFile()
          }
        })
      } else {
        console.log('no htmlFiles')
        writeNewFile()
      }
      
    })
  }

  const findEachHeadFileTag = async (headTagMatches) => {
    // find preload links in head and delete them
    asyncForEach(headTagMatches, async (tagMatch, i) => {
      transformedFileTxt = transformedFileTxt.replace(tagMatch, '')
    })
  }

  const replaceRefWithScriptContent = async (scriptFile, sourceFileTxt, scriptMatch) => {
    // replace script ref tag with inline script
    try {
      await fs.readFile(scriptFile, 'utf8', async (err, scriptFileTxt) => {
        if (err) console.log(err)
        else {
          transformedFileTxt = sourceFileTxt.replace(scriptMatch, `<script type='text/javascript'>${scriptFileTxt}</script>`)
        }
      })
    } catch (e) { console.log(e) }
  }

  const findEachScriptFileRef = async (scriptMatches, sourceFileTxt) => {
    // find each actual script file ref'd inline
    asyncForEach(scriptMatches, async (scriptMatch, i) => {
      const src = new RegExp(scriptMatch.match(srcFinder).pop(), 'g')
      try {
        find.file(src, __dirname, async scriptFiles => {
          if (scriptFiles.length > 0) {
            const scriptFile = scriptFiles.pop()
            await replaceRefWithScriptContent(scriptFile, sourceFileTxt, scriptMatch)
          } else {
            console.log('no script files found')
          }
        })
      } catch (e) { console.log(e) }
    })
  }

  const getHTMLtxtContent = async sourceFile => {
    // get txtContent of original HTML
    try {
      await fs.readFile(sourceFile, 'utf8', async (err, sourceFileTxt) => {
        if (err) console.log(err)
        else {
          const scriptMatches = sourceFileTxt.match(scriptFinder)
          if (scriptMatches.length > 0) {
            await findEachScriptFileRef(scriptMatches, sourceFileTxt)
          }
          const headTagMatches = sourceFileTxt.match(headTagFinder)
          if (headTagMatches.length > 0) {
            await findEachHeadFileTag(headTagMatches, sourceFileTxt)
          }
          handleExtraTagsFor(transformedFileTxt)
        }
      })
    } catch(e) { console.log(e) }

  }

  const checkFoldersForMatchedFiles = async (fileName, parentDir) => {
    try {
      await file.walkSync(__dirname, (walkDirPath, walkDirs, walkFiles) => {
        // recursively check folders for files that match
        const matchedFiles = walkFiles.filter(f => f === fileName)
        const walkParentDir = walkDirPath.split('/').pop()
        const isntPageFolder = walkDirPath.indexOf('page') === -1
        // theres also a page/index file >>> can you use a regex method to clean this sloppy part up?
        // console.log(matchedFiles)

        if (matchedFiles.length > 0 && walkParentDir === parentDir && isntPageFolder) {
          const sourceFile = file.path.join(walkDirPath, matchedFiles.pop())
          console.log(sourceFile)
          getHTMLtxtContent(sourceFile)
        }
      })
    } catch (e) { console.log(e) }
  }

  const transformer = async fileNamePlusParentDir => {
    // use parentDir also because next/static outputs all files as index
    const splitFileName = fileNamePlusParentDir.split('/')
    const fileName = splitFileName[1]
    const parentDir = splitFileName[0]
    checkFoldersForMatchedFiles(fileName, parentDir)
  }

  transformer('index/index.html')
}

module.exports = MSify
