(function () {
    if (customElements.get("analyst-chart")) return;
  
    class AnalystExport extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.container = document.createElement("div");
        this.shadowRoot.appendChild(this.container);
      }
  
      async connectedCallback() {
        await this.loadApexCharts();
        await this.renderChart();
      }
  
      async loadApexCharts() {
        if (window.ApexCharts) {
          console.log("ApexCharts already loaded.");
          return;
        }
  
        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/apexcharts@4.2/dist/apexcharts.min.js";
          script.onload = () => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href =
              "https://cdn.jsdelivr.net/npm/apexcharts@4.2/dist/apexcharts.min.css";
            link.onload = () => {
              resolve();
            };
            link.onerror = () =>
              reject(new Error("Failed to load ApexCharts CSS"));
            document.head.appendChild(link);
          };
  
          script.onerror = () =>
            reject(new Error("Failed to load ApexCharts JS"));
          document.head.appendChild(script);
        });
      }
  
      async renderChart() {
        const apiKey = this.getAttribute("api-key");
        const font = this.getAttribute("font");
        const theme = this.getAttribute("theme");
        const palette = this.parsePalette(this.getAttribute("palette"));
  
        if (!apiKey) {
          this.container.innerHTML = `<p>Error: API key is required.</p>`;
          return;
        }
  
        // **SHOW LOADER WHILE FETCHING DATA**
        this.container.innerHTML = `
          <style>
            .loader {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .loading-text {
              text-align: center;
              font-size: 14px;
              color: #666;
            }
          </style>
          <div class="loader"></div>
          <p class="loading-text">Building charts...</p>
        `;
  
        try {
          const response = await fetch(
            "https://us-central1-analyst-kriv.cloudfunctions.net/getExportable",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                key: apiKey,
                font: font,
                theme: theme,
                palette: palette,
              }),
            }
          );
  
          if (!response.ok) throw new Error(`API error: ${response.status}`);
  
          if (response.status === 200) {
            const chartData = await response.json();
            this.chartOptions = chartData.data;
          } else if (response.status === 206) {
            this.chartOptions = {
              title: {
                text: "Exportable Works!",
              },
              series: [
                {
                  name: "A",
                  data: [1, 4, 8, 1, 4, 9, 10],
                },
                {
                  name: "B",
                  data: [1, 2, 4, 2, 4, 2, 1],
                },
              ],
              chart: {
                height: 350,
                type: "area",
                toolbar: {
                  show: false,
                },
              },
              dataLabels: {
                enabled: false,
              },
              legend: {
                show: true,
                position: "bottom",
              },
              plotOptions: {
                bar: {
                  columnWidth: "55%",
                  borderRadius: 5,
                },
              },
              tooltip: {
                theme: "dark",
                followCursor: true,
              },
            };
          }
  
          // **REPLACE LOADER WITH CHART**
          const divId = apiKey.slice(-8);
          this.container.innerHTML =
            response.status == 206
              ? `<div id="${divId}">This is a demo. Live data will load on the designated domain.</div>`
              : `<div class="chart-container" id="${divId}"></div>`;
  
          const chart = new ApexCharts(
            this.shadowRoot.getElementById(divId),
            this.chartOptions
          );
          chart.render();
        } catch (err) {
          console.error("Error rendering chart:", err);
          this.container.innerHTML = `<p>Error loading chart data.</p>`;
        }
      }
  
      parsePalette(paletteString) {
        if (!paletteString) return [];
  
        return paletteString
          .replace(/[\[\]']/g, "")
          .split(",")
          .map((color) => color.trim());
      }
    }
    customElements.define("analyst-chart", AnalystExport);
  })();
  