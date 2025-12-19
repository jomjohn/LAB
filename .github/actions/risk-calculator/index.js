const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Get inputs
    const filesThreshold = parseInt(core.getInput('files-changed-threshold'), 10);
    const linesThreshold = parseInt(core.getInput('lines-changed-threshold'), 10);
    const criticalPaths = core.getInput('critical-paths').split(',').map(p => p.trim()).filter(Boolean);
    
    // Simulate getting PR stats (in real scenario, would use GitHub API)
    const prContext = github.context.payload.pull_request;
    const filesChanged = prContext?.changed_files || Math.floor(Math.random() * 30) + 1;
    const additions = prContext?.additions || Math.floor(Math.random() * 400) + 50;
    const deletions = prContext?.deletions || Math.floor(Math.random() * 200) + 20;
    const totalLines = additions + deletions;
    
    core.info(`Analyzing deployment risk...`);
    core.info(`Files changed: ${filesChanged}`);
    core.info(`Lines changed: ${totalLines} (+${additions}/-${deletions})`);
    
    // Calculate risk factors
    let riskScore = 0;
    const factors = [];
    
    // Factor 1: Number of files changed
    const filesFactor = Math.min((filesChanged / filesThreshold) * 30, 30);
    riskScore += filesFactor;
    factors.push({
      name: 'Files Changed',
      value: filesChanged,
      threshold: filesThreshold,
      score: Math.round(filesFactor),
      impact: filesFactor > 20 ? 'high' : filesFactor > 10 ? 'medium' : 'low'
    });
    
    // Factor 2: Lines of code changed
    const linesFactor = Math.min((totalLines / linesThreshold) * 35, 35);
    riskScore += linesFactor;
    factors.push({
      name: 'Lines Changed',
      value: totalLines,
      threshold: linesThreshold,
      score: Math.round(linesFactor),
      impact: linesFactor > 25 ? 'high' : linesFactor > 15 ? 'medium' : 'low'
    });
    
    // Factor 3: Critical paths touched (simulated)
    const touchesCritical = criticalPaths.length > 0 && Math.random() > 0.6;
    if (touchesCritical) {
      riskScore += 25;
      factors.push({
        name: 'Critical Paths',
        value: 'Yes',
        threshold: 'N/A',
        score: 25,
        impact: 'high'
      });
    } else {
      factors.push({
        name: 'Critical Paths',
        value: 'No',
        threshold: 'N/A',
        score: 0,
        impact: 'none'
      });
    }
    
    // Factor 4: Ratio of deletions to additions
    const deletionRatio = deletions / (additions + 1);
    if (deletionRatio > 0.5) {
      riskScore += 10;
      factors.push({
        name: 'High Deletion Ratio',
        value: `${Math.round(deletionRatio * 100)}%`,
        threshold: '50%',
        score: 10,
        impact: 'medium'
      });
    }
    
    // Cap at 100
    riskScore = Math.min(Math.round(riskScore), 100);
    
    // Determine risk level and recommendation
    let riskLevel, recommendation, approvalRequired;
    
    if (riskScore >= 75) {
      riskLevel = 'critical';
      recommendation = 'Deploy during maintenance window with full team availability';
      approvalRequired = 'VP approval required';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
      recommendation = 'Deploy during low-traffic hours with rollback plan ready';
      approvalRequired = 'Senior engineer approval required';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
      recommendation = 'Standard deployment process with monitoring';
      approvalRequired = 'Peer review required';
    } else {
      riskLevel = 'low';
      recommendation = 'Safe to deploy anytime';
      approvalRequired = 'Standard review process';
    }
    
    // Create analysis object
    const analysis = {
      riskScore,
      riskLevel,
      factors,
      metrics: {
        filesChanged,
        additions,
        deletions,
        totalLines
      },
      recommendation,
      approvalRequired,
      timestamp: new Date().toISOString()
    };
    
    // Set outputs
    core.setOutput('risk-score', riskScore.toString());
    core.setOutput('risk-level', riskLevel);
    core.setOutput('recommendation', recommendation);
    core.setOutput('analysis', JSON.stringify(analysis));
    
    // Log results with color coding
    core.startGroup('Risk Assessment Results');
    core.info(`Risk Score: ${riskScore}/100`);
    core.info(`Risk Level: ${riskLevel.toUpperCase()}`);
    core.info(`Recommendation: ${recommendation}`);
    core.info(`Approval: ${approvalRequired}`);
    core.endGroup();
    
    // Create detailed summary
    core.summary
      .addHeading('Deployment Risk Assessment')
      .addRaw(`<h3>Risk Score: ${riskScore}/100 - ${riskLevel.toUpperCase()}</h3>`)
      .addTable([
        [{data: 'Factor', header: true}, {data: 'Value', header: true}, {data: 'Threshold', header: true}, {data: 'Score', header: true}, {data: 'Impact', header: true}],
        ...factors.map(f => [
          f.name,
          f.value.toString(),
          f.threshold.toString(),
          f.score.toString(),
          f.impact
        ])
      ])
      .addHeading('Recommendation', 3)
      .addQuote(recommendation)
      .addHeading('Required Approval', 3)
      .addQuote(approvalRequired)
      .write();
    
    // Warning for high risk
    if (riskScore >= 50) {
      core.warning(`High risk deployment detected (${riskScore}/100). Extra caution recommended.`);
    }
    
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
