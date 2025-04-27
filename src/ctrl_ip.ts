import e, { NextFunction, Request, Response } from "express";
import {
  EC2Client,
  AllocateAddressCommand,
  AssociateAddressCommand,
  DescribeAddressesCommand,
  ReleaseAddressCommand,
  DisassociateAddressCommand,
} from "@aws-sdk/client-ec2";

import 'dotenv/config'

const client = new EC2Client({});
const INSTANCE_ID = process.env.INSTANCE_ID || "i-ENTER_YOUR_ID";

if (INSTANCE_ID === "i-ENTER_YOUR_ID") {
  console.log("!! Please set INSTANCE_ID !!");
}

export async function handle_acquire(req: Request, res: Response, next: NextFunction) {
  const comm_desc = new DescribeAddressesCommand({
    Filters: [
      {
        "Name": "instance-id",
        "Values": [INSTANCE_ID]
      }
    ]
  });

  const { Addresses } = await client.send(comm_desc);
  if (Addresses === undefined) {
    res.status(500).send("Describe command returned undefined");
    return;
  } else if (Addresses.length > 0) {
    res.status(500).send(`More than one addresses already assigned: ${Addresses}`)
    return;
  }

  const comm_alloc = new AllocateAddressCommand({});

  const { AllocationId } = await client.send(comm_alloc);
  if (AllocationId === undefined) {
    res.status(500).send("AllocationId is not defined");
    return;
  }

  const comm_assoc = new AssociateAddressCommand({
    AllocationId: AllocationId,
    InstanceId: INSTANCE_ID
  })
  const { AssociationId } = await client.send(comm_assoc);
  if (AssociationId === undefined) {
    res.status(500).send("AssociationId is not defined");
    return;
  }

  res.status(200).send(`Successfully acquired ipv4 address with AssociationId: ${AssociationId}`);
  return;
}

export async function handle_release(req: Request, res: Response, next: NextFunction) {
  const comm_desc = new DescribeAddressesCommand({
    Filters: [
      {
        "Name": "instance-id",
        "Values": [INSTANCE_ID]
      }
    ]
  });

  const { Addresses } = await client.send(comm_desc);
  if (Addresses === undefined) {
    res.status(500).send("Describe command returned undefined");
    return;
  } else if (Addresses.length == 0) {
    res.status(404).send(`Address not found for instance ${INSTANCE_ID}`)
    return;
  } else if (Addresses.length > 1) {
    res.status(500).send(`More than one addresses found: ${Addresses}`)
    return;
  }
  const {
    AssociationId,
    AllocationId,
    PublicIp
  } = Addresses[0];

  if (AssociationId === undefined || AllocationId === undefined || PublicIp === undefined) {
    res.status(500).send(`Impossible response: \n\
      AssociationId: ${AssociationId}\n\tAllocationId: ${AllocationId}\n\tPublicId: ${PublicIp}`)
    return;
  }

  const comm_disalloc = new DisassociateAddressCommand({
    AssociationId: AssociationId,
  })
  await client.send(comm_disalloc)

  const comm_release = new ReleaseAddressCommand({
    AllocationId: AllocationId,
  })
  await client.send(comm_release)

  res.status(200).send(`Successfully released address ${PublicIp}`)
}

export async function handle_describe(req: Request, res: Response, next: NextFunction) {
  const comm_desc = new DescribeAddressesCommand({
    Filters: [
      {
        "Name": "instance-id",
        "Values": [INSTANCE_ID]
      }
    ]
  });

  const { Addresses } = await client.send(comm_desc);
  if (Addresses === undefined) {
    res.status(500).send("Describe command returned undefined");
  } else if (Addresses.length == 0) {
    res.status(200).send("No addresses are acquired for specified instance.")
  } else {
    const resp = Addresses.map(addr => {
      const {
        AssociationId,
        AllocationId,
        PublicIp
      } = addr;

      return `AssociationId: ${AssociationId}\n\tAllocationId: ${AllocationId}\n\tPublicId: ${PublicIp})`;
    })
    res.status(200).send(`Found addresses:\n ${resp}`)
  }

  return;
}