import { entityItemSelector } from '../../support/commands';
import {
  entityTableSelector,
  entityDetailsButtonSelector,
  entityDetailsBackButtonSelector,
  entityCreateButtonSelector,
  entityCreateSaveButtonSelector,
  entityCreateCancelButtonSelector,
  entityEditButtonSelector,
  entityDeleteButtonSelector,
  entityConfirmDeleteButtonSelector,
} from '../../support/entity';

describe('Product e2e test', () => {
  const productPageUrl = '/product';
  const productPageUrlPattern = new RegExp('/product(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'admin';
  const password = Cypress.env('E2E_PASSWORD') ?? 'admin';

  beforeEach(() => {
    cy.getOauth2Data();
    cy.get('@oauth2Data').then(oauth2Data => {
      cy.oauthLogin(oauth2Data, username, password);
    });
    cy.intercept('GET', '/services/store/api/products').as('entitiesRequest');
    cy.visit('');
    cy.get(entityItemSelector).should('exist');
  });

  afterEach(() => {
    cy.get('@oauth2Data').then(oauth2Data => {
      cy.oauthLogout(oauth2Data);
    });
    cy.clearCache();
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/store/api/products+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/store/api/products').as('postEntityRequest');
    cy.intercept('DELETE', '/services/store/api/products/*').as('deleteEntityRequest');
  });

  it('should load Products', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('product');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Product').should('exist');
    cy.url().should('match', productPageUrlPattern);
  });

  it('should load details Product page', function () {
    cy.visit(productPageUrl);
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        this.skip();
      }
    });
    cy.get(entityDetailsButtonSelector).first().click({ force: true });
    cy.getEntityDetailsHeading('product');
    cy.get(entityDetailsBackButtonSelector).click({ force: true });
    cy.wait('@entitiesRequest').then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    });
    cy.url().should('match', productPageUrlPattern);
  });

  it('should load create Product page', () => {
    cy.visit(productPageUrl);
    cy.wait('@entitiesRequest');
    cy.get(entityCreateButtonSelector).click({ force: true });
    cy.getEntityCreateUpdateHeading('Product');
    cy.get(entityCreateSaveButtonSelector).should('exist');
    cy.get(entityCreateCancelButtonSelector).click({ force: true });
    cy.wait('@entitiesRequest').then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    });
    cy.url().should('match', productPageUrlPattern);
  });

  it('should load edit Product page', function () {
    cy.visit(productPageUrl);
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        this.skip();
      }
    });
    cy.get(entityEditButtonSelector).first().click({ force: true });
    cy.getEntityCreateUpdateHeading('Product');
    cy.get(entityCreateSaveButtonSelector).should('exist');
    cy.get(entityCreateCancelButtonSelector).click({ force: true });
    cy.wait('@entitiesRequest').then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    });
    cy.url().should('match', productPageUrlPattern);
  });

  it('should create an instance of Product', () => {
    cy.visit(productPageUrl);
    cy.get(entityCreateButtonSelector).click({ force: true });
    cy.getEntityCreateUpdateHeading('Product');

    cy.get(`[data-cy="title"]`).type('Rustic Tasty').should('have.value', 'Rustic Tasty');

    cy.get(`[data-cy="price"]`).type('59757').should('have.value', '59757');

    cy.setFieldImageAsBytesOfEntity('image', 'integration-test.png', 'image/png');

    // since cypress clicks submit too fast before the blob fields are validated
    cy.wait(200); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.get(entityCreateSaveButtonSelector).click({ force: true });
    cy.scrollTo('top', { ensureScrollable: false });
    cy.get(entityCreateSaveButtonSelector).should('not.exist');
    cy.wait('@postEntityRequest').then(({ response }) => {
      expect(response.statusCode).to.equal(201);
    });
    cy.wait('@entitiesRequest').then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    });
    cy.url().should('match', productPageUrlPattern);
  });

  it('should delete last instance of Product', function () {
    cy.visit(productPageUrl);
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length > 0) {
        cy.get(entityTableSelector).should('have.lengthOf', response.body.length);
        cy.get(entityDeleteButtonSelector).last().click({ force: true });
        cy.getEntityDeleteDialogHeading('product').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click({ force: true });
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', productPageUrlPattern);
      } else {
        this.skip();
      }
    });
  });
});
