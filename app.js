const find = require('find')
const fs = require('fs')
const file = require('file')
const { promisify } = require('util')

let newFileName = 'smc_lp_02.html'
MSify(newFileName)


function MSify (newFileName, sourceFileNamePlusParentDir) {
  const headTagFinder = /\<link rel="preload(.*?)as="script"\/\>/g
  const scriptFinder = /(<script async="" id="__NEXT_PAGE|<script src="\/_next)([^;]*?)\>\<\/script\>/g
  const srcFinder = /(?<=src="\/).*?(?=")/

  const outputDir = 'missionsuiteready'
  // const safeDirname = file.path.abspath(__dirname)

  let transformedFileTxt = ''

  const writeNewFile = async newHTML => {
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

  const handleExtraTagsFor = txtContent => {
    let newHTML = txtContent
    console.log(newHTML, 'WORKED')
    writeNewFile(newHTML)
  }

  const replaceRefWithScriptContent = async (scriptFile, sourceFileTxt, scriptMatch, shouldFire) => {
    // replace script ref tag with inline script
    try {
      await fs.readFile(scriptFile, 'utf8', (err, scriptFileTxt) => {
        if (err) console.log(err)
        else {
          transformedFileTxt = sourceFileTxt.replace(scriptMatch, `<script type='text/javascript'>${scriptFileTxt}</script>`)
          if (shouldFire) {
            handleExtraTagsFor(transformedFileTxt)
          }
        }
      })
    } catch (e) { console.log(e) }
  }

  const findEachScriptFileRef = async (scriptMatches, sourceFileTxt) => {
    // find each actual script file ref'd inline
    scriptMatches.forEach((scriptMatch, i) => {
      const src = new RegExp(scriptMatch.match(srcFinder).pop(), 'g')
      try {
        find.file(src, __dirname, scriptFiles => {
          if (scriptFiles.length > 0) {
            const scriptFile = scriptFiles.pop()
            const shouldFire = i === scriptMatches.length - 1
            replaceRefWithScriptContent(scriptFile, sourceFileTxt, scriptMatch, shouldFire)
          } else {
            console.log('no script files found')
          }
        })
      } catch (e) { console.log(e) }
    })
  }

  const findEachHeadFileTag = async (headTagMatches, sourceFileTxt) => {
    headTagMatches.forEach((tagMatch, i) => {

    })
  }

  const getHTMLtxtContent = async sourceFile => {
    // get txtContent of original HTML
    try {
      await fs.readFile(sourceFile, 'utf8', (err, sourceFileTxt) => {
        if (err) console.log(err)
        else {
          const scriptMatches = sourceFileTxt.match(scriptFinder)
          if (scriptMatches.length > 0) {
            findEachScriptFileRef(scriptMatches, sourceFileTxt)
          }
          const headTagMatches = sourceFileTxt.match(headTagFinder)
          if (headTagMatches.length > 0) {
            findEachHeadFileTag(headTagMatches, sourceFileTxt)
          }
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
          // console.log(sourceFile)
          await getHTMLtxtContent(sourceFile)
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
