/**
 * Created by k33g on 6/28/16.
 */

"use strict";
const config = require('./config.js');
const githubHook = require('githubHook'); // listen to webhooks
const octonode = require('octonode'); // needed to play with GitHub API
const tools = require('./tools.js');

// create 3 octocats
const dizzy = octonode.client({
  username: config.octocats[0].username,
  password: config.octocats[0].password
},{
  protocol: config.protocol,
  hostname: config.hostname
});

const babs = octonode.client({
  username: config.octocats[1].username,
  password: config.octocats[1].password
},{
  protocol: config.protocol,
  hostname: config.hostname
});

const buster = octonode.client({
  username: config.octocats[2].username,
  password: config.octocats[2].password
},{
  protocol: config.protocol,
  hostname: config.hostname
});


const github = githubHook({
  port: config.httpPort,
  path: config.payLoadUrl
});

github.listen();

github.on('*', (event, repo, ref, data) => {
  
  switch (event) {
    case 'issues':

      switch (data.action) {

        case 'opened':

          data.issue.body = data.issue.body !== null || data.issue.body !== undefined ? data.issue.body : "";

          /*
            Babs will add a comment and notifiy you, if you type hello in the issue
           */
          tools.checkIfString(data.issue.body).contains('hello') == true ? (() => {
            // add comment to the current issue
            babs.post(
              data.issue.comments_url,
              {
                body:`Hi @${data.sender.login}, I'm Babs, happy to read you :heart::heart::heart:`
              },
              (err, status, body, headers)=> {}
            )

          })() : undefined; // do nothing

          
          break;

        case 'closed':

          break;

        case 'reopened':

          break;
        
        default:
          console.log(data.action);
      }
      
      break;

    case 'issue_comment':

      tools.checkIfString(data.comment.body).contains('please') &&
      tools.checkIfString(data.comment.body).contains('file:') &&
      tools.checkIfString(data.comment.body).contains('branch:') ? (() => {
        
        let fileName = tools.extractFileName(data.comment.body);
        let branchName = tools.extractBranchName(data.comment.body);
        let content = tools.generateContent();
        
        /*
          If you type something like that in the comment of an issue: "please create file:tuto.md; on branch:wip_tuto; :)",
          buster will create a file named tuto.md on the wip_tuto branch
          warning: you need to put a ; after file name and branch name
         */
        
        buster.get(
          `${data.repository.url}/branches`,
          (err, status, body, headers)=> {

            let branches = body;
            let searchIfBranchExists = branches.filter(item => item.name == branchName)[0]; //TODO: try with find
            let branch = branchName == undefined || null ? 'master' :  branchName;

            // TODO: manage errors
            // TODO: gardening and factorisation
            if(searchIfBranchExists) { // branch already exists
              
              buster.put(
                `${data.repository.url}/contents/${fileName}`,
                {
                  message:`Add a file: ${fileName}`, 
                  content: new Buffer(content).toString('base64'), 
                  branch: branch
                },
                (err, status, body, headers)=> {
                  // buster posts a comment to say that's ok
                  buster.post(
                    data.issue.comments_url,
                    {
                      body:`OK @${data.sender.login}, see: [${fileName}](${body.content.html_url})`
                    },
                    (err, status, body, headers)=> {

                    }
                  );
                  // And buster creates a PR
                  buster.post(`${data.repository.url}/pulls`, {
                    title: `Proposal for ${fileName}`,
                    body: `Hey People!`,
                    head: branchName,
                    base: `master`
                  }, (err, status, body, headers)=> {

                  });
                  
                }
              );
              
            } else { // we have to create the branch
              
              buster.post(
                `${data.repository.url}/git/refs`,
                {
                  sha:branches[0].commit.sha, ref: `refs/heads/${branchName}`
                },
                (err, status, body, headers)=> {

                  buster.put(
                    `${data.repository.url}/contents/${fileName}`,
                    {
                      message:`Add a file: ${fileName} on a new branch: ${branchName}`,
                      content: new Buffer(content).toString('base64'),
                      branch: branch
                    },
                    (err, status, body, headers)=> {
                      // buster posts a comment to say that's ok
                      buster.post(
                        data.issue.comments_url,
                        {
                          body:`OK @${data.sender.login}, see: [${fileName}](${body.content.html_url})`
                        },
                        (err, status, body, headers)=> {

                        }
                      );
                      // And buster creates a PR
                      buster.post(`${data.repository.url}/pulls`, {
                        title: `Proposal for ${fileName}`,
                        body: `Hey People!`,
                        head: branchName,
                        base: `master`
                      }, (err, status, body, headers) => {

                      });

                    }
                  );
                  
                }
              );
            }
          }
        );
        
        
      })() : undefined; // do nothing
      

      break;
    
    case 'push':

      (data.head_commit!==undefined || data.head_commit!==null) ? (() => {
        
        //let commitMessage = data.head_commit.message;

        /*
          If you put a :) in your code
         */

        data.head_commit.modified !== undefined ? (() => {

          // get the first modified file
          let fileName = data.head_commit.modified[0] == undefined
            ? data.head_commit.added[0]
            : data.head_commit.modified[0];


          data.head_commit.id!==undefined ? (() => { // id is undefined when branch is deleted
            
            let commitUrl = data.repository.commits_url.replace('{/sha}',`/${data.head_commit.id}`);

            dizzy.get( // get content of the commit
              commitUrl,
              (err, status, body, headers)=> { //TODO: manage errors
                let fileDetails = body.files;
                let fileObject = fileDetails.find(item => item.filename == fileName);

                let lastUpdates = fileObject.patch.split('\n').filter(update => update.startsWith('+'));

                lastUpdates.forEach(line => {
                  console.log(line)
                  
                  // if there is a :) in the source code
                  tools.checkIfString(line).contains(':)') == true ? (() => {

                    dizzy.post( // post comment on the commit
                      `${commitUrl}/comments`,
                      {
                        body: `Great stuff @${data.head_commit.committer.name} :+1: on this`
                      },
                      (err, status, body, headers)=> {
                        // nothing ....
                      }
                    );

                  })() : undefined; // do nothing
                  
                });
              }
            );

          })() : undefined; // do nothing

        })() : undefined; // do nothing

      })() : undefined; // do nothing
      
      break;
    
    case 'commit_comment':

      break;    
    default:
      console.log(event);
  }

});