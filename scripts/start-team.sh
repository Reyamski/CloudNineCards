#!/bin/bash
# Cloud Nine Cards — AI Team tmux Dashboard
# Run: bash scripts/start-team.sh

SESSION="cloudnine"
PROJECT="/mnt/c/Users/Reyam/Downloads/AI/shopify-tcg-store"

# Create inbox files if they don't exist
mkdir -p "$PROJECT/inbox" "$PROJECT/outbox"
for agent in architect developer data-engineer qa docs orchestrator; do
  touch "$PROJECT/inbox/$agent.md"
  touch "$PROJECT/outbox/$agent.md"
done

tmux kill-session -t $SESSION 2>/dev/null
tmux new-session -d -s $SESSION -x 220 -y 50

# Enable pane border titles
tmux set-option -t $SESSION pane-border-status top
tmux set-option -t $SESSION pane-border-format "[ #{pane_title} ]"

# ── Window 0: CEO Dashboard ──
tmux rename-window -t $SESSION:0 "CEO"
tmux send-keys -t $SESSION:0 "cd $PROJECT && watch -n 2 'echo \"===== CEO DASHBOARD =====\" && cat agents/CEO.md'" Enter

# ── Window 1: Orchestrator ──
tmux new-window -t $SESSION -n "Orchestrator"
tmux select-pane -t $SESSION:1.0 -T "ORCHESTRATOR"
tmux send-keys -t $SESSION:1 "cd $PROJECT && watch -n 2 'echo \"===== ORCHESTRATOR =====\"  && echo \"\" && echo \"-- TASK QUEUE --\" && cat agents/ORCHESTRATOR.md | grep -A100 \"Task Queue\"'" Enter

# ── Window 2: Agents — each watches their inbox ──
tmux new-window -t $SESSION -n "Agents"

# Pane 0: Architect (starts here, top-left)
tmux send-keys -t $SESSION:2 "cd $PROJECT && watch -n 2 'echo \"===== ARCHITECT =====\" && cat inbox/architect.md && echo && echo \"-- OUTPUT --\" && cat outbox/architect.md'" Enter

# Split right → new pane becomes active (Developer, top-right)
tmux split-window -h -t $SESSION:2
tmux send-keys -t $SESSION:2 "cd $PROJECT && watch -n 2 'echo \"===== DEVELOPER =====\" && cat inbox/developer.md && echo && echo \"-- OUTPUT --\" && cat outbox/developer.md'" Enter

# Split down from top-right → bottom-right (QA)
tmux split-window -v -t $SESSION:2
tmux send-keys -t $SESSION:2 "cd $PROJECT && watch -n 2 'echo \"===== QA ENGINEER =====\" && cat inbox/qa.md && echo && echo \"-- OUTPUT --\" && cat outbox/qa.md'" Enter

# Go back to top-left, split down → bottom-left (Data Engineer)
tmux select-pane -t $SESSION:2.0
tmux split-window -v -t $SESSION:2
tmux send-keys -t $SESSION:2 "cd $PROJECT && watch -n 2 'echo \"===== DATA ENGINEER =====\" && cat inbox/data-engineer.md && echo && echo \"-- OUTPUT --\" && cat outbox/data-engineer.md'" Enter

# ── Window 3: Outputs (live feed) ──
tmux new-window -t $SESSION -n "Outputs"
tmux select-pane -t $SESSION:3.0 -T "LIVE OUTPUTS"
tmux send-keys -t $SESSION:3 "cd $PROJECT && watch -n 2 'echo \"===== COMPLETED WORK =====\" && for f in outbox/*.md; do echo \"\" && echo \">>> \$f\" && cat \"\$f\"; done'" Enter

tmux split-window -v -t $SESSION:3
tmux select-pane -t $SESSION:3.1 -T "DECISIONS LOG"
tmux send-keys -t $SESSION:3.1 "cd $PROJECT && watch -n 3 'echo \"===== DECISIONS LOG =====\" && cat shared/DECISIONS.md'" Enter

# Focus Agents window on start
tmux select-window -t $SESSION:2
tmux attach-session -t $SESSION
