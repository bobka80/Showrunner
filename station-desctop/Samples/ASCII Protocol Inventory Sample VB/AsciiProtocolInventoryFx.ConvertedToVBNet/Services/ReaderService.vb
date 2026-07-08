'-----------------------------------------------------------------------
' <copyright file="ReaderService.cs" company="Technology Solutions UK Ltd"> 
'     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
' </copyright> 
' <author>Robin Stone</author>
'-----------------------------------------------------------------------
Imports System.Collections.Generic
Imports System.Linq
Imports System.Text
Imports TechnologySolutions.Rfid.AsciiProtocol

''' <summary>
''' Provides a service to access the interface to the ASCII protocol UHF Reader
''' </summary>
Public Class ReaderService
    Implements IDisposable
    ''' <summary>
    ''' True once this instance is disposed
    ''' </summary>
    Private disposed As Boolean

    ''' <summary>
    ''' The commander that communicates with the reader
    ''' </summary>
    Private m_commander As AsciiCommander

    ''' <summary>
    ''' Initializes a new instance of the ReaderService class
    ''' </summary>
    Public Sub New()
        Me.m_commander = New AsciiCommander()
        Me.PortName = "COM32"
    End Sub

    ''' <summary>
    ''' Gets or sets the name of the port used for <see cref="Connect"/>
    ''' </summary>
    Public Property PortName() As String
        Get
            Return m_PortName
        End Get
        Set(ByVal value As String)
            m_PortName = Value
        End Set
    End Property
    Private m_PortName As String

    ''' <summary>
    ''' Gets the <see cref="IAsciiCommandExecuting"/> instance to command or configure
    ''' </summary>
    Public ReadOnly Property Commander() As IAsciiCommandExecuting
        Get
            Return Me.m_commander
        End Get
    End Property

    ''' <summary>
    ''' Gets a value indicating whether the reader is connected
    ''' </summary>
    Public ReadOnly Property IsConnected() As Boolean
        Get
            Return Me.m_commander.IsConnected
        End Get
    End Property

    ''' <summary>
    ''' Connects to the reader using the current <see cref="PortName"/>
    ''' </summary>
    Public Sub Connect()
        Try
            Dim serialPort As IAsciiSerialPort = New SerialPortWrapper(Me.PortName)
            Me.m_commander.Connect(serialPort)
        Catch ex As Exception
            System.Diagnostics.Debug.WriteLine(ex.Message)
        End Try
    End Sub

    ''' <summary>
    ''' Disconnects from the current reader if connected
    ''' </summary>
    Public Sub Disconnect()
        Me.m_commander.Disconnect()
    End Sub

    ''' <summary>
    ''' Disposes an instance of the ReaderService class
    ''' </summary>
    Public Sub Dispose() Implements IDisposable.Dispose
        Me.Dispose(True)
        GC.SuppressFinalize(Me)
    End Sub

    ''' <summary>
    ''' Disposes an instance of the ReaderService class
    ''' </summary>
    ''' <param name="disposing">True to dispose managed as well as unmanaged resources</param>
    Protected Overridable Sub Dispose(ByVal disposing As Boolean)
        If Not Me.disposed Then
            If disposing Then
                Me.m_commander.Dispose()
            End If

            Me.disposed = True
        End If
    End Sub
End Class
