# Human Made Money — Technical Stack Decision v1.0

## Purpose

This document defines the official technology stack for Human Made Money.

The stack is optimized for:

* Fast development
* AI-assisted coding
* Scalability
* Security
* Long-term maintainability

---

# Frontend

## Web Application

Technology:

Next.js + TypeScript

Purpose:

* Main web application
* User dashboard
* Challenge creation
* Community features

---

# UI System

Technology:

Tailwind CSS + shadcn/ui

Purpose:

* Reusable components
* Modern interface
* Futuristic design system

---

# Animation

Technology:

Framer Motion

Purpose:

* Interface transitions
* AI activity animations
* Trust timeline effects

---

# Mobile

Technology:

React Native + Expo

Purpose:

* iOS and mobile MVP

Future:

Native SwiftUI application.

---

# Backend

Technology:

Node.js + NestJS

Purpose:

* API services
* Business logic
* Authentication
* Escrow workflows

---

# Database

Technology:

PostgreSQL

Purpose:

Primary application database.

Stores:

* Users
* Challenges
* Agreements
* Escrow records
* Transactions
* AI decisions

---

# Database ORM

Technology:

Prisma

Purpose:

* Database models
* Queries
* Migrations

---

# Authentication

Technology:

Auth.js + Passkeys

Supports:

* Email login
* Google login
* Apple login
* Passwordless authentication

---

# Cloud Infrastructure

Initial architecture:

Frontend:

Vercel

Backend:

AWS

Database:

AWS RDS PostgreSQL

Storage:

AWS S3

---

# AI Infrastructure

AI Models:

OpenAI models

Used for:

* Agreement understanding
* Reasoning
* Summarization
* AI assistance

---

# AI Agent Framework

Technology:

LangGraph

Purpose:

Create reliable multi-agent workflows.

---

# AI Memory

Technology:

PostgreSQL + pgvector

Purpose:

* Evidence retrieval
* Historical decisions
* AI context

---

# MCP Infrastructure

Model Context Protocol provides controlled AI tool access.

MCP servers:

* Finance MCP
* Sports MCP
* Public Data MCP
* Internal HMM MCP

---

# Payment Architecture

Human Made Money will integrate regulated payment infrastructure.

Architecture:

Payment Provider

↓

Escrow Ledger

↓

Settlement Engine

---

# Repository Structure

```
human-made-money/

apps/

web/

mobile/

backend/

packages/

ai/

mcp/

database/

docs/

infrastructure/
```

---

# Final Stack Summary

Frontend:
Next.js + TypeScript

Mobile:
React Native + Expo

Backend:
NestJS

Database:
PostgreSQL

ORM:
Prisma

UI:
Tailwind + shadcn/ui

Animation:
Framer Motion

AI:
OpenAI + LangGraph

Memory:
pgvector

Cloud:
Vercel + AWS

---

# Status

Approved Architecture

Version:

v1.0
