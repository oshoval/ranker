// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

export interface GraphQLPRResponse {
  data?: {
    repository: {
      pullRequests: {
        nodes: GraphQLPRNode[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        totalCount: number;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

export interface GraphQLSinglePRResponse {
  data?: {
    repository: {
      pullRequest: GraphQLPRNode | null;
    } | null;
  } | null;
  errors?: Array<{ message: string }>;
}

export interface GraphQLPRNode {
  number: number;
  title: string;
  url: string;
  author: {
    login: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN';
  isDraft: boolean;
  body: string | null;
  headRefName: string;
  headRefOid: string;
  baseRefName: string;
  labels: {
    nodes: Array<{ name: string; color: string }>;
  };
  reviews: {
    nodes: Array<{
      state:
        | 'APPROVED'
        | 'CHANGES_REQUESTED'
        | 'COMMENTED'
        | 'PENDING'
        | 'DISMISSED';
      author: { login: string } | null;
      submittedAt: string | null;
    }>;
  };
  reviewRequests: {
    nodes: Array<{
      requestedReviewer: { login: string } | null;
    }>;
  };
  files: {
    nodes: Array<{
      path: string;
      additions: number;
      deletions: number;
    }>;
  } | null;
}

export const GET_PRS_QUERY = `
  query GetPRs($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: 100, states: OPEN, after: $cursor) {
        totalCount
        nodes {
          number
          title
          url
          author {
            login
          }
          createdAt
          updatedAt
          additions
          deletions
          changedFiles
          mergeable
          isDraft
          body
          headRefName
          headRefOid
          baseRefName
          labels(first: 20) {
            nodes {
              name
              color
            }
          }
          reviews(first: 50) {
            nodes {
              state
              author {
                login
              }
              submittedAt
            }
          }
          reviewRequests(first: 20) {
            nodes {
              requestedReviewer {
                ... on User {
                  login
                }
              }
            }
          }
          files(first: 100) {
            nodes {
              path
              additions
              deletions
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const GET_SINGLE_PR_QUERY = `
  query GetPR($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        number
        title
        url
        author { login }
        createdAt
        updatedAt
        additions
        deletions
        changedFiles
        mergeable
        isDraft
        body
        headRefName
        headRefOid
        baseRefName
        labels(first: 20) { nodes { name color } }
        reviews(first: 50) {
          nodes { state author { login } submittedAt }
        }
        reviewRequests(first: 20) {
          nodes { requestedReviewer { ... on User { login } } }
        }
        files(first: 100) {
          nodes { path additions deletions }
        }
      }
    }
  }
`;
