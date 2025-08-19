// components/app-table.js
export class AppTable extends HTMLElement {
  constructor() {
    super();
    this.tableId = `table-${Math.random().toString(36).substring(2, 9)}`;
  }

  connectedCallback() {
    this.render();
    this.initDataTable();
  }

  render() {
    this.innerHTML = `
      <table id="${this.tableId}" class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Âge</th>
            <th>Pays</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Alice</td><td>25</td><td>France</td></tr>
          <tr><td>Bob</td><td>30</td><td>Canada</td></tr>
          <tr><td>Charlie</td><td>28</td><td>Suisse</td></tr>
        </tbody>
      </table>
    `;
  }

  initDataTable() {
    // ⚠️ DataTables est exposé globalement via jQuery
    $(`#${this.tableId}`).DataTable({
      paging: true,
      searching: true,
      ordering: true,
      responsive: true,
      // language: {
      //   url: "../node_modules/datatables.net-plugins/i18n/fr-FR.json"
      // }
    });
  }
}

customElements.define("app-table", AppTable);
