const find = require('find')
const fs = require('fs')
const file = require('file')

const scriptFinder = /(<script async="" id="__NEXT_PAGE|<script src="\/_next)([^;]*?)\>\<\/script\>/g
const srcFinder = /(?<=src="\/).*?(?=")/


const transformer = async fileNamePlusParentDir => {
  // use parentDir also because next/static outputs all files as index
  let transformedFileTxt = ''
  const splitFileName = fileNamePlusParentDir.split('/')
  const fileName = splitFileName[1]
  const parentDir = splitFileName[0]
  // recursively check folders for files that match
  file.walkSync(__dirname, (walkDirPath, walkDirs, walkFiles) => {
    const matchedFiles = walkFiles.filter(f => f === fileName)
    const walkParentDir = walkDirPath.split('/').pop()
    const isntPageFolder = walkDirPath.indexOf('page') === -1
    // theres also a page/index file >>> can you use a regex method to clean this sloppy part up?
    if (matchedFiles.length > 0 && walkParentDir === parentDir && isntPageFolder) {
      const sourceFile = file.path.join(walkDirPath, matchedFiles.pop())
      // console.log('source file: ', sourceFile)
      // get txtContent of original HTML
      fs.readFile(sourceFile, 'utf8', (err, sourceFileTxt) => {
        if (err) console.log(err)
        else {
          const scriptMatches = sourceFileTxt.match(scriptFinder)
          if (scriptMatches.length > 0) {
            // find each actual script file ref'd inline
            scriptMatches.forEach((scriptMatch, i) => {
              const src = new RegExp(scriptMatch.match(srcFinder).pop(), 'g')
              find.file(src, __dirname, scriptFiles => {
                if (scriptFiles.length > 0) {
                  const scriptFile = scriptFiles.pop()
                  // console.log('script file found: ', scriptFile)

                  // replace script ref tag with inline script
                  fs.readFile(scriptFile, 'utf8', (err, scriptFileTxt) => {
                    if (err) console.log(err)
                    else {
                      transformedFileTxt = sourceFileTxt.replace(scriptMatch, `<script type='text/javascript'>${scriptFileTxt}</script>`)
                      // if (i === scriptMatches.length - 1) return transformedFileTxt
                    }
                  })
                } else console.log('couldnt find the referenced script file')
              })
            })
          } else console.log('no matching script tags found in source file')
        }
      })
    }
  })
  
  // await setTimeout(() => { return transformedFileTxt }, 1000)
  return transformedFileTxt
}

const transformedHTML = transformer('index/index.html')

const handleExtraTagsFor = txtContent => {
  let newHTML = txtContent
  return newHTML
}

const readyHTML = handleExtraTagsFor(transformedHTML)

console.log(readyHTML)


const writeNewFile = readyHTML => {
  find.dir('missionsuiteready', __dirname, (dirs, err) => {
    if (err) console.log(err)
    const outputDirExists = dirs.length > 0
    console.log(outputDirExists)
    if (outputDirExists) {
      
    } else {

    }
  })
  
  // if ()
}

writeNewFile(readyHTML)


// const doIt = async () => {
//   await readyHTML
//   console.log(readyHTML)
  
  
// }

// doIt()