4. 切換到另一台電腦 (例如 PC2)
現在，當您移動到 PC2 並準備開始工作時，您只需要重複第一步的流程即可。
步驟：
切換到專案目錄。
執行 git pull origin main。
這個指令會檢查 GitHub 上的 origin 儲存庫，發現您剛剛從 PC1 推送上來的最新 commit，並將它們下載、合併到您 PC2 的本地專案中。
完成後，PC2 上的程式碼就和 PC1 離開時的狀態完全一樣了，您可以安心地開始新的開發工作。
總結與流程圖
這個跨電腦同步的開發流程可以總結如下：
在 PC1:
git pull origin main (開始工作前，確保是最新狀態)
... 進行開發 (修改、git add、git commit) ...
git push origin main (結束工作後，分享您的進度)
切換到 PC2:
git pull origin main (開始工作前，同步來自 PC1 的進度)
... 進行開發 (修改、git add、git commit) ...
git push origin main (結束工作後，分享您的進度)
再切換回 PC1:
git pull origin main (開始工作前，同步來自 PC2 的進度)
... 以此類推 ...
一個重要的提醒： 養成每次開始工作前都先 pull 的習慣至關重要。如果您忘記 pull，並在一個舊的版本上做了修改，當您要去 push 的時候，Git 會因為遠端有您本地沒有的更新而拒絕您的 push，這時就需要額外的步驟來解決衝突 (merge conflict)，會比較麻煩。