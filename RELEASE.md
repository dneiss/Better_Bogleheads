To release, run through this file with your AI agent

- Ensure that the manifest description is less than 132 characters
- Correct any typos in any txt or md files
- Code review of all files for correctness, security, and performance and consider feedback
- Update Description_full.txt for new/removed features and apply that to the Chrome extension site
- Update Description_short.txt for shortened text and apply that to the Chrome extension site
- Create any new screenshots in the Chrome_listing_screenshots and apply that to the Chrome extension site
- Update the marquee_promo_tile pics and apply them to the Chrome extension site
- Verify README.md file is still current
- Ensure PRIVACY_POLICY.md is still current
- Ensure LICENSE is still current
- Ensure that there is no PII leakage into any files
- Create a release by running release.sh and bump versions
- Upload the files.zip release to Chrome extension site
- git tag with release version specified in the manifest.json file
