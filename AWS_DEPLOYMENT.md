# AWS Deployment Guide for EmotionFlix

## Overview
This guide covers deploying EmotionFlix to AWS using EC2, RDS PostgreSQL, and Route 53.

## Prerequisites
- AWS Account
- Domain name (optional)
- TMDB API key

## Environment Variables

Create a `.env` file on your EC2 instance with:

```bash
# Frontend Configuration
VITE_API_URL=https://your-api-domain.com/api
VITE_TMDB_API_KEY=your_tmdb_api_key_here

# Backend Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com

# Database Configuration (AWS RDS)
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/emotionflix
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=emotionflix
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

## AWS Setup Steps

### 1. RDS PostgreSQL Setup
1. Create RDS PostgreSQL instance
2. Configure security groups to allow EC2 access
3. Create database `emotionflix`
4. Note the endpoint URL

### 2. EC2 Instance Setup
1. Launch EC2 instance (t3.medium recommended)
2. Configure security groups:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3001 (API - optional)
3. Install Docker and Docker Compose

### 3. Application Deployment
1. Clone repository to EC2
2. Create `.env` file with production values
3. Build and run with Docker Compose:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### 4. Domain Configuration (Route 53)
1. Register domain or use existing
2. Create hosted zone
3. Create A record pointing to EC2 IP
4. Create CNAME for API subdomain

### 5. SSL Certificate
1. Use AWS Certificate Manager
2. Create certificate for your domain
3. Configure load balancer or reverse proxy

## Production Checklist

- [ ] All development console logs removed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Health checks working
- [ ] Error monitoring set up
- [ ] Backup strategy configured

## Monitoring

### CloudWatch Setup
1. Enable CloudWatch logs
2. Set up alarms for:
   - High CPU usage
   - Database connections
   - API response times
   - Error rates

### Health Checks
- API: `https://your-domain.com/api/health`
- Frontend: `https://your-domain.com`

## Security Considerations

1. **Database Security**
   - Use RDS security groups
   - Enable encryption at rest
   - Regular backups

2. **Application Security**
   - JWT secrets in environment variables
   - CORS properly configured
   - Input validation

3. **Infrastructure Security**
   - EC2 security groups minimal
   - Route 53 DNS security
   - SSL/TLS encryption

## Troubleshooting

### Common Issues
1. **Database Connection**: Check security groups and credentials
2. **CORS Errors**: Verify FRONTEND_URL configuration
3. **Build Failures**: Check Node.js version and dependencies
4. **Domain Issues**: Verify Route 53 configuration

### Logs
- Application logs: `docker-compose logs app`
- Database logs: `docker-compose logs postgres`
- Nginx logs: `/var/log/nginx/`

## Performance Optimization

1. **Database**
   - Enable connection pooling
   - Optimize queries
   - Regular maintenance

2. **Application**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement caching

3. **Infrastructure**
   - Use appropriate instance size
   - Enable auto-scaling if needed
   - Monitor resource usage 