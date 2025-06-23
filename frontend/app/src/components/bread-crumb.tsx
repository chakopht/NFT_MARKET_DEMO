"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb"

  import {
    Card,
  } from "@/components/ui/card"

  import { usePathname } from 'next/navigation';
import React from "react";
  
  
  export default function DynamicBreadcrumb() {

    const pathname = usePathname();

    const generateBreadcrumb = (path: string) => {
        console.log(`path is ${path}`);
        const segments = path.split('/').filter(segment => segment);
        return segments.map((segment, index) => {
          const breadcrumbPath = `/${segments.slice(0, index + 1).join('/')}`;
          return {
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            path: breadcrumbPath,
          };
        });
      };

    const breadcrumbs = generateBreadcrumb(pathname);

    return (
      <Card className="content-div p-5 h-15 flex">
      <Breadcrumb>
        <BreadcrumbList>
        <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((breadcrumb) => (
          <React.Fragment key={breadcrumb.path}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href={breadcrumb.path}>{breadcrumb.label}</BreadcrumbLink>
                </BreadcrumbItem>
          </React.Fragment>
       ))}
        </BreadcrumbList>
      </Breadcrumb>
      </Card>
    );
  }