/**
 * Created by k33g on 6/28/16.
 */

"use strict";
const config = require('./config.js');
const githubHook = require('githubHook'); // listen to webhooks
const octonode = require('octonode'); // needed to play with GitHub API
const tools = require('./tools.js');
const chalk = require('chalk');
//const Monet = require('monet');


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
          //console.log(data.issue.title);
          //console.log(data.issue.body);

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
                      }, (err, status, body, headers)=> {

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

      break;
    
    case 'commit_comment':

      break;    
    default:
      console.log(event);
  }

});